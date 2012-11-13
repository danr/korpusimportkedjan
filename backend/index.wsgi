# -*- mode: python; coding: utf-8 -*-

import urlparse
import json

import os
import sys
import traceback


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


import sb.util as util

from make_makefile import makefile
from pipeline import run_pipeline

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

w = Writer('w')
sys.stdout = w
sys.stderr = w

def application(environ,start_response):

    w = Writer()
    sys.stdout = w
    sys.stderr = w

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

    fmt = query_dict.get('fmt', ['xml'])[0]

    only_makefile = query_dict.get('only_makefile', [''])[0]
    only_makefile = only_makefile.lower() == 'true'

    incremental = query_dict.get('incremental', [''])[0]
    incremental = incremental.lower() == 'true'

    settings = json.loads(query_dict.get('settings',['{}'])[0])

    status = '200 OK'
    response_headers = [('Content-Type', 'text/plain'),
                        ('Access-Control-Allow-Origin', '*')]

    start_response(status, response_headers)

    if only_makefile:
        return [makefile(settings)]
    else:
        try:
            util.log.info("Running pipeline with text: %s (settings: %s fmt: %s, incremental: %s)", post, settings, fmt, incremental)
            return run_pipeline(pipeline, post, settings, fmt, incremental)
        except:
            util.log.error('Error in handling code: %s', sys.exc_info()[1])
            traceback.print_exception(*sys.exc_info())
            return 'Error in pipeline: "%s"\n' % sys.exc_info()[1]

if __name__ == "__main__":
    from wsgiref.simple_server import make_server
    httpd = make_server("", 8051, application)
    httpd.serve_forever()
