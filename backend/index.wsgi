# -*- mode: python; coding: utf-8 -*-

from xml.sax.saxutils import escape
from threading import Thread
from wsgiref.util import FileWrapper
from Queue import Queue


import urlparse
import json

import os
import sys

# Static pipeline settings
pipeline = dict()

# Where the pipeline is hosted
pipeline['dir'] = '/dev/shm/pipeline/'

# Socket file
pipeline['sockfile'] = os.path.join(pipeline['dir'], 'pipeline.sock')

# The catalaunch binary
catalaunch = os.path.join(pipeline['dir'],'catalaunch')

# The "python" interpreter, replaced with catalaunch
pipeline['python'] = "%s %s" % (catalaunch, pipeline['sockfile'])

# The number of processes
pipeline['processes'] = 2

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
        self.log = open(os.path.join(pipeline['dir'], 'log'), mode)

    def write(self, msg):
        self.log.write(msg)
        self.flush()

    def flush(self):
        self.log.flush()

    def close(self):
        self.log.close()

def within_result_tag(s):
    return '<result>\n' + s + '</result>\n'

request=0

def build(pipeline, post, settings, incremental, fmt, request):

    b = Build(pipeline, post, settings)

    def putstr(msg):
        print "%s (%d) %s" % (b.build_hash, request, msg)

    """
    Start build or listen to existing build
    """
    if b.build_hash not in builds:
        putstr("Starting a new build")
        builds[b.build_hash] = b
        b.make_files()
        t = Thread(target=Build.run, args=[b, fmt])
        t.start()
    else:
        putstr("Joining existing build")
        b = builds[b.build_hash]

    # Make a new queue which receives messages from the builder process
    q = Queue()
    b.queues.append(q)

    # Result already exists
    if finished(b.status):
        putstr("Result already exists")
        if incremental:
            yield b.result()
            yield '</result>\n'
        else:
            yield within_result_tag(b.result())

    # Listen for completion
    else:
        increment_header_sent = False

        if incremental and b.status == Status.Running:
            putstr("Already running, sending increment header and message")
            increment_header_sent = True
            yield b.increment_header()
            yield b.increment_msg()

        while True:
            msg_type, msg = q.get()
            putstr("Message %s: %s" % (msg_type, str(msg).rstrip()))
            if msg_type == Message.StatusChange and finished(msg):
                break
            elif incremental:
                # Header has not been sent yet
                if not increment_header_sent:
                    if msg_type == Message.IncrementHeader:
                        increment_header_sent = True
                        yield msg
                    elif msg_type == Message.Increment:
                        increment_header_sent = True
                        yield b.increment_header()
                        yield msg
                    elif msg_type == Message.IncrementFooter:
                        # Don't send footer if header has not been sent
                        pass
                    else:
                        # Impossible
                        assert false
                # Header has been sent
                else:
                    # Don't resend header (how did this happen?!)
                    if msg == Message.IncrementHeader:
                        pass
                    else:
                        yield msg

        putstr("Getting result...")
        if incremental:
            yield b.result()
            yield "</result>\n"
        else:
            yield within_result_tag(b.result())

def application(environ, start_response):
    global request
    request+=1

    query_dict = urlparse.parse_qs(environ['QUERY_STRING'])

    post = ""
    try:
        length= int(environ.get('CONTENT_LENGTH', '0'))
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

    settings = json.loads(query_dict.get('settings',['{}'])[0])

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
            for k in build(pipeline, post, settings, incremental, fmt, int(request)):
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
