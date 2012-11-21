# -*- mode: python; coding: utf-8 -*-

from xml.sax.saxutils import escape
from threading import Thread
from wsgiref.util import FileWrapper
from Queue import Queue

import urlparse
import json

import os
import sys

from jsonschema import Draft3Validator
from schema_utils import make_default_populator

with open("settings_schema.json","r") as f:
    schema_str = f.read()

settings_schema = json.loads(schema_str)
settings_validator = Draft3Validator(settings_schema)
settings_populate_defaults = make_default_populator(settings_schema)

class PipelineSettings(object):
    """Static pipeline settings"""

    # Where the pipeline is hosted
    directory = '/dev/shm/pipeline/'

    # Socket file
    socket_file = os.path.join(directory, 'pipeline.sock')

    # The catalaunch binary
    catalaunch_binary = os.path.join(directory, 'catalaunch')

    # The "python" interpreter, replaced with catalaunch
    python_interpreter = catalaunch_binary + " " + socket_file

    # The number of processes (sent as a -j flag to make)
    processes = 2

    # Log file
    log_file = os.path.join(directory, 'log')

pipeline_settings = PipelineSettings()

# Append path to annotate and backend
paths = ['/home/dan/annotate/python','/export/htdocs/dan/backend']
for path in paths:
    if path not in sys.path:
        sys.path.append(path)

os.environ['PYTHONPATH'] = ":".join(filter(lambda s : s, sys.path))

# Where the models are hosted. Replaces SB_MODELS environment variable if it does not exist
os.environ['SB_MODELS'] = os.environ.get('SB_MODELS','/home/dan/annotate/models')

# No remote installations allowed
os.environ['remote_cwb_datadir']="null"
os.environ['remote_cwb_registry']="null"
os.environ['remote_host']="null"

# Ongoing and finished builds
builds = dict()

import sb.util as util

from make_makefile import makefile
from pipeline import Build, Status, Message, finished, make_trace

class Writer(object):
    def __init__(self, mode='a'):
        self.log = open(pipeline_settings.log_file, mode)

    def write(self, msg):
        self.log.write(msg)
        self.flush()

    def flush(self):
        self.log.flush()

    def close(self):
        self.log.close()

request=0

def mk_putstr(build_hash, request_number):
    def putstr(msg):
        print "%s (%d) %s" % (build_hash, request, msg)
    return putstr

def build(original_text, settings, incremental, fmt, request_number):
    """
    Starts a build for this corpus. If it is already running,
    joins it. Messages from the build is received on a queue.
    """

    build = Build(pipeline_settings, original_text, settings)

    putstr = mk_putstr(build.build_hash, request_number)

    # Start build or listen to existing build
    if build.build_hash not in builds:
        putstr("Starting a new build")
        builds[build.build_hash] = build
        build.make_files()
        t = Thread(target=Build.run, args=[build, fmt])
        t.start()
    else:
        putstr("Joining existing build")
        build = builds[build.build_hash]

    return join_build(build, incremental, putstr)

def join_build(build, incremental, putstr):
    """
    Joins an existing build, and sends increment messages
    until it is completed, then sends the build's result.
    """

    # Make a new queue which receives messages from the builder process
    queue = Queue()
    build.queues.append(queue)

    def get_result():
        assert(finished(build.status))
        if incremental:
            return build.result() + '</result>\n'
        else:
            return '<result>\n' + build.result() + '</result>\n'


    # Result already exists
    if finished(build.status):
        putstr("Result already exists")
        yield get_result()

    # Listen for completion
    else:
        increment_header_sent = False

        if incremental and build.status == Status.Running:
            putstr("Already running, sending increment header and message")
            increment_header_sent = True
            yield build.increment_header()
            yield build.increment_msg()

        while True:
            msg_type, msg = queue.get()
            putstr("Message %s: %s" % (Message.lookup[msg_type],
                                       Status.lookup[msg]
                                       if msg_type == Message.StatusChange
                                       else str(msg).rstrip()))
            # Has status changed to finished?
            if msg_type == Message.StatusChange:
                if finished(msg):
                    break
            # Increment message
            elif incremental:
                # Header has not been sent yet
                if not increment_header_sent:
                    if msg_type == Message.IncrementHeader:
                        increment_header_sent = True
                        yield msg
                    elif msg_type == Message.Increment:
                        increment_header_sent = True
                        yield build.increment_header()
                        yield msg
                    elif msg_type == Message.IncrementFooter:
                        # Don't send footer if header has not been sent
                        pass
                # Header has been sent
                else:
                    # Don't resend header (this case should be impossible)
                    if msg == Message.IncrementHeader:
                        pass
                    else:
                        yield msg

        putstr("Getting result...")
        yield get_result()

def application(environ, start_response):
    """
    Parses the data, but most processing is done in the function build
    """
    global request
    request+=1

    query_dict = urlparse.parse_qs(environ['QUERY_STRING'])

    post = ""
    try:
        length = int(environ.get('CONTENT_LENGTH', '0'))
    except ValueError:
        length = 0
    if length != 0:
        post = environ['wsgi.input'].read(length)

    if length == 0:
        post = query_dict.get('text', [''])[0]

    fmt = query_dict.get('format', ['xml'])[0]
    fmt = fmt.lower()

    incremental = query_dict.get('incremental', [''])[0]
    incremental = incremental.lower() == 'true'

    error = None

    try:
        settings = json.loads(query_dict.get('settings',['{}'])[0])
    except:
        error = escape(make_trace())

    settings = settings_populate_defaults(settings)

    for e in sorted(settings_validator.iter_errors(settings)):
        if error is None:
            error = ""
        print e
        error += str(e) + "\n"

    if error is not None:
        print error
        status = '400 Bad Request'
        response_headers = [('Content-Type', 'text/plain'),
                            ('Access-Control-Allow-Origin', '*')]

        start_response(status, response_headers)
        yield '<result><error>' + error + '</error>\n</result>\n'
    else:
        status = '200 OK'
        response_headers = [('Content-Type', 'text/plain'),
                            ('Access-Control-Allow-Origin', '*')]

        start_response(status, response_headers)

        # command = query_dict.get('command', [''])[0]

        if fmt == "makefile":
            yield makefile(settings)
        else:
            if incremental:
                print "Sending result start"
                yield "<result>\n"

            try:
                for k in build(post, settings, incremental, fmt, int(request)):
                    yield k

            except:
                trace = make_trace()
                print trace
                if not incremental:
                    yield '<result>'
                yield '<trace>' + escape(trace) + '</trace>\n'
                yield '</result>\n'


if __name__ == "__main__":
    """
    from wsgiref.simple_server import make_server
    httpd = make_server("", 8051, application)
    httpd.serve_forever()
    """
    import eventlet
    from eventlet import wsgi
    eventlet.monkey_patch()
    wsgi.server(eventlet.listen(("", 8051)), application, minimum_chunk_size=1, max_size=100, keepalive=True)
