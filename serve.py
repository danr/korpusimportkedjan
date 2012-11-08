import sb.util as util

import cgi
import json

import os
import sys
import traceback

from make_makefile import makefile
from pipeline import run_pipeline

# Where the models are hosted. Replaces SB_MODELS environment variable if it does not exist
os.environ['SB_MODELS'] = os.environ.get('SB_MODELS','/export/htdocs/dan/annotate/models')

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

def application(environ,start_response):

    query_dict = cgi.parse_qs(environ['QUERY_STRING'])

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
            return run_pipeline(pipeline, post, settings, fmt, add_root_tag, incremental)
        except:
            util.log.error('Error in handling code: %s', sys.exc_info()[1])
            traceback.print_exception(*sys.exc_info())
            return 'Error in pipeline: "%s"\n' % sys.exc_info()[1]

if __name__ == "__main__":
    from wsgiref.simple_server import make_server
    httpd = make_server('localhost', 8051, application)
    httpd.serve_forever()
