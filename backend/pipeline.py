# -*- coding: utf-8 -*-

from xml.sax.saxutils import escape
from Queue import Queue

import sb.util as util

import sys
import errno
import os
import shutil
import traceback

from make_makefile import makefile

def make_hash(text):
    import hashlib
    return hashlib.sha1(text).hexdigest()

def make(settings):
    from subprocess import Popen, PIPE
    util.log.info("CALL: /usr/bin/make %s", ' '.join(settings))
    return Popen(['/usr/bin/make'] + settings,
                 shell=False, close_fds=False,
                 stdin=None, stdout=PIPE, stderr=PIPE)

def mkdir(d):
    try:
        os.makedirs(d, mode=0777)
    except OSError as exc:
        if exc.errno == errno.EEXIST:
            pass
        else:
            raise
    util.system.call_binary('chmod', ['777', d, '-v'])

def rmfile(f):
    try:
        os.remove(f)
    except OSError as exc:
        if exc.errno == errno.ENOENT:
            pass
        else:
            raise

class Pipeline(object):
    def __init__(self, pipeline, text, settings):
        """
        Creates the necessary directories and the makefile for this
        file. Returns the hash and the directory the pipeline runs on
        """

        self.pipeline = pipeline
        self.settings = settings

        self.hash = make_hash(text)

        util.log.info('%s (length: %s, settings: %s)', self.hash, len(text), settings)

        self.directory = os.path.join(self.pipeline['dir'], self.hash)

        self.original_dir = os.path.join(self.directory, 'original')
        self.annotations_dir =  os.path.join(self.directory, 'annotations')
        self.export_dir = os.path.join(self.directory, 'export')
        self.warnings_log_file = os.path.join(self.directory,'warnings.log');

        map(mkdir, [self.original_dir, self.annotations_dir])

        self.makefile = os.path.join(self.directory, 'Makefile')

        with open(self.makefile, 'w') as m:
            m.write(makefile(settings))

        self.text_file = os.path.join(self.original_dir, 'text.xml')
        if os.path.isfile(self.text_file):
            util.log.info("File exists and is not rewritten: %s", self.hash)
        else:
            with open(self.text_file, 'w') as f:
                f.write(text)

    def on_increment(self, step, cmd):
        raise NotImplementedError

    def on_increments_discovery(self, steps):
        raise NotImplementedError

    def on_increments_completion(self):
        raise NotImplementedError

    def on_warnings(self, warnings):
        raise NotImplementedError

    def on_completion(self, corpus):
        raise NotImplementedError

    def on_error(self, trace, stdout, stderr):
        raise NotImplementedError

    def run(self, fmt, incremental):
        """
        Runs the `text` throught the pipeline creating a makefile from `settings`.
        `pipeline` should be a dict containing 'dir', 'python' and 'processes'.
        """

        # No remote installations allowed
        os.environ['remote_cwb_datadir']="null"
        os.environ['remote_cwb_registry']="null"
        os.environ['remote_host']="null"

        # setup_pipeline(pipeline, text)

        make_settings = ['-C', self.directory,
                         'dir_chmod=777',
                         '-j', str(self.pipeline['processes']),
                         "python=%s" % self.pipeline['python']]

        if fmt == 'vrt':
            make_settings = ['vrt'] + make_settings
            self.out_file = os.path.join(self.annotations_dir, 'text.vrt')
        elif fmt == 'cwb':
            make_settings = ['cwb'] + make_settings
            self.out_file = os.path.join(self.annotations_dir, 'text.vrt')
        else:
            make_settings = ['export'] + make_settings
            self.out_file = os.path.join(self.export_dir, 'text.xml')

        map(rmfile,[self.out_file,self.warnings_log_file])

        if incremental:
            stdout, _ = make(make_settings + ['--dry-run']).communicate("")
            self.on_increments_discovery(stdout.count("catalaunch"))

        process = make(make_settings)
        try:
            make_out = []

            if incremental:
                step = 0;
                for line in iter (process.stdout.readline, ''):
                    print line.rstrip()
                    make_out += [line]
                    if incremental and "catalaunch" in line:
                        step += 1;
                        cmd = line.split(" ")[3]
                        self.on_increment(step, cmd)

                self.on_increments_completion()
            else:
                make_out = [process.stdout.read()]

            # Send warnings
            try:
                with open(self.warnings_log_file, "r") as f:
                    self.on_warnings(f.read().rstrip())
            except IOError as e:
                pass

            # Send the completed corpus
            with open(self.out_file, "r") as f:
                self.on_completion(f.read())
        except:
            from sys import exc_type
            traceback.print_exception(*sys.exc_info())
            trace = "".join(repr(traceback.format_exception(exc_type, exc_value, exc_traceback)))

            stdout = "\n".join(make_out)
            stderr = process.stderr.read().rstrip()

            self.on_error(trace, stdout, stderr)

class DirectPipeline(Pipeline):

    def write(self, s):
        self.queue.put(s.rstrip() + "\n")

    def close(self):
        if self.result_start_sent:
            self.queue.put('</result>')
        self.queue.put(None)

    def __init__(self, *args):
        self.queue = Queue()
        self.result_start_sent = False
        super(DirectPipeline, self).__init__(*args)

    def on_increments_discovery(self, steps):
        self.write('<result>')
        self.write('<increments steps="%s">' % steps)
        self.result_start_sent = True

    def on_increment(self, step, cmd):
        self.write('<increment command="%s">%s</increment>' % (cmd, step))

    def on_increments_completion(self):
        self.write('</increments>')

    def on_warnings(self, warnings):
        self.write('<warning>' + escape(warnings) + '</warning>')

    def on_completion(self, corpus):
        self.write(corpus)
        self.close()

    def on_error(self, trace, stdout, stderr):
        self.write("\n".join((
            '<trace>' + escape(trace) + '</trace>',
            '<error>' + escape(stderr) + '</error>',
            '<output>' + escape(stdout) + '</output>')))
        self.close()
