# -*- coding: utf-8 -*-
# The Build class that contains the information about an initalised, running,
# or finished build.

from xml.sax.saxutils import escape

import os
import time
import logging

from config import Config
from enums import Status, Message, finished
from make_makefile import makefile
from make_trace import make_trace
from utils import make_hash, make, mkdir, rmdir

log = logging.getLogger('pipeline.' + __name__)

class Build(object):
    """
    The Build class.

    Register yourself with a queue to the queues list to get messages
    about status changes and incremental messages.
    """

    def access(self):
        """Updates the access time of this build"""
        self.accessed_time = time.time()

    def __init__(self, text, settings):
        """
        Creates the necessary directories and the makefile for this
        text and the JSON settings.
        """
        self.queues = []

        self.text = text
        self.makefile_contents = makefile(settings)

        self.build_hash = make_hash(self.text, self.makefile_contents)

        self.log = logging.getLogger('pipeline.%s.%s' % (__name__, self.build_hash))

        self.settings = settings

        self.status = None

        # Deem this build as accessed now.
        self.access()

        # Output from make, line by line
        self.make_out = []

        # Set increments to dummy values
        self.command = ""
        self.steps = 0
        self.step = 0

    def increment_msg(self):
        """
        The current increment message
        """
        return '<increment command="%s" step="%s" steps="%s"/>\n' % (self.command, self.step, self.steps)

    def send_to_all(self, msg):
        """
        Sends a message to all listeners
        """
        map(lambda q: q.put(msg), self.queues)

    def change_status(self, status):
        """
        Change the status and notify all listeners
        """
        self.status = status
        self.status_change_time = time.time()
        self.send_to_all((Message.StatusChange, self.status))

    def change_step(self, new_cmd=None, new_step=None, new_steps=None):
        """
        Changes the current step, and notifies all listeners that the increment
        has been changed.
        """
        if new_step is not None:
            self.step = new_step
        if new_cmd is not None:
            self.command = new_cmd
        if new_steps is not None:
            self.steps = new_steps
        self.send_to_all((Message.Increment, self.increment_msg()))

    def make_files(self):
        """
        Makes the files for building this corpus:
        directories, the original corpus and the makefile
        """
        self.change_status(Status.Init)

        self.directory = os.path.join(Config.directory, self.build_hash)

        self.original_dir = os.path.join(self.directory, 'original')
        self.annotations_dir =  os.path.join(self.directory, 'annotations')
        self.export_dir = os.path.join(self.directory, 'export')
        self.warnings_log_file = os.path.join(self.directory,'warnings.log');

        self.makefile = os.path.join(self.directory, 'Makefile')

        self.text_file = os.path.join(self.original_dir, 'text.xml')

        # Make directories
        map(mkdir, [self.original_dir, self.annotations_dir])

        # Make makefile
        with open(self.makefile, 'w') as m:
            m.write(makefile(self.settings))

        if os.path.isfile(self.text_file):
            # This file has probably been built by a previous incarnation of the pipeline
            # (index.wsgi script has been restarted)
            self.log.info("File exists and is not rewritten: %s" % self.build_hash)
        else:
            with open(self.text_file, 'w') as f:
                f.write(self.text)

    def remove_files(self):
        """
        Removes the files associated with this build.
        """
        self.change_status(Status.Deleted)
        self.log.info("Removing files")
        rmdir(self.directory)

    def _run(self, fmt):
        """
        Run make, sending increments, and eventually change status to done.
        """
        make_settings = ['-C', self.directory,
                         'dir_chmod=777',
                         '-j', str(Config.processes),
                         "python=%s" % Config.python_interpreter]

        if fmt == 'vrt' or fmt == 'cwb':
            make_settings = [fmt] + make_settings
            self.out_file = os.path.join(self.annotations_dir, 'text.vrt')
        else:
            make_settings = ['export'] + make_settings
            self.out_file = os.path.join(self.export_dir, 'text.xml')

        # Do a dry run to get the number of invocations that will be made
        stdout, _ = make(make_settings + ['--dry-run']).communicate("")
        steps = stdout.count(Config.python_interpreter)

        # Start make for real. First set up some environment variables
        os.environ['SB_MODELS'] = Config.sb_models
        # No remote installations allowed
        os.environ['remote_cwb_datadir']="null"
        os.environ['remote_cwb_registry']="null"
        os.environ['remote_host']="null"

        # Now, make!
        self.make_process = make(make_settings)

        self.change_status(Status.Running)

        # Process the output from make
        self.change_step(new_cmd="", new_step=0, new_steps=steps + 1)
        step = 0
        for line in iter(self.make_process.stdout.readline, ''):
            self.make_out.append(line)
            if Config.python_interpreter in line:
                step += 1;
                argstring = line.split(Config.python_interpreter)[1]
                arguments = argstring.lstrip().split()
                command = " ".join(arguments[1:3]) if "--" in arguments[3] else arguments[1]
                self.change_step(new_step=step, new_cmd=command)
        self.change_step(new_cmd="", new_step=step+1)

        # Send warnings
        try:
            with open(self.warnings_log_file, "r") as f:
                self.warnings = f.read().rstrip()
        except IOError:
            self.warnings = None

        # The corpus should now be in self.out_file
        # Its contents is not stored because of memory reasons
        assert os.path.isfile(self.out_file)

        self.change_status(Status.Done)

    def run(self, fmt):
        """
        Runs make, catching errors
        """
        self.make_process = None
        self.trace, self.stdout, self.stderr = ("", "", "")

        try:
            self._run(fmt)
        except:
            self.trace = make_trace()
            self.log.exception("Error when running make")
            self.stdout = "".join(self.make_out)
            if self.make_process:
                self.stderr = self.make_process.stderr.read().rstrip()
            self.change_status(Status.Error)

    def result(self):
        """
        Returns the result: either a built corpus with possible warning messages,
        or the error messages for an unsuccessful build
        """
        assert(finished(self.status))
        if self.status == Status.Done:
            out = []
            if self.warnings:
                out.append('<warning>' + escape(self.warnings) + '</warning>')
            with open(self.out_file, "r") as f:
                out.append(f.read())
            return "\n".join(out)
        else:
            out = ['<trace>' + escape(self.trace) + '</trace>',
                   '<stderr>' + escape(self.stderr) + '</stderr>',
                   '<stdout>' + escape(self.stdout) + '</stdout>']
            return "\n".join(out) + "\n"
