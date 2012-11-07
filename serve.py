from cgi import parse_qs, escape, FieldStorage
from wsgiref.simple_server import make_server
from make_makefile import makefile
import json

import sb.util as util

import errno
import os
import shutil
import sys
import traceback
from pipeline import pipeline

# Where the pipeline is hosted
PIPELINE_DIR = '/dev/shm/pipeline'

# The socket file
PIPELINE_SOCK = os.path.join(PIPELINE_DIR, 'pipeline.sock')

# Where the models are hosted
os.environ['SB_MODELS'] = '/home/dan/code/annotate/models'

# processes
PROCESSES=2

# The "python" interpreter, replaced with catalaunch
os.environ['PYTHON'] = "%s %s" % (os.path.join(PIPELINE_DIR,'catalaunch'), PIPELINE_SOCK)

def application(environ,start_response):
    query_dict = parse_qs(environ['QUERY_STRING'])

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

    add_root_tag = query_dict.get('add_root_tag', [''])[0]
    add_root_tag = add_root_tag.lower() == 'true'

    settings = json.loads(query_dict['settings'][0])

    status = '200 OK'
    response_headers = [('Content-Type', 'text/plain'),
                        ('Access-Control-Allow-Origin', '*')]

    start_response(status, response_headers)

    if only_makefile:
        return [makefile(settings)]
    else:
        try:
            util.log.info("Running pipeline with text: %s (settings: %s fmt: %s, incremental: %s)", post, settings, fmt, incremental)
            return pipeline(PIPELINE_DIR, PROCESSES, post, settings, fmt, add_root_tag, incremental)
        except:
            util.log.error('Error in handling code: %s', sys.exc_info()[1])
            traceback.print_exception(*sys.exc_info())
            return 'Error in pipeline: "%s"\n' % sys.exc_info()[1]

httpd = make_server('localhost', 8051, application)
httpd.serve_forever()
