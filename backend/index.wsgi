# -*- mode: python; coding: utf-8 -*-


################################################################################
# Two the two configuration variables in this file:

# Pythonpaths to the sb python directory, and to the the directory of this script.
paths = ['/home/dan/annotate/python','/export/htdocs_sb/annoteringslabb/']

# The log file location. Set this to None if you rather want to log to stdout
log_file_location = "/export/htdocs_sb/annoteringslabb/pipeline/annotate.log"
if __name__ == "__main__":
    log_file_location = None

# The rest of the code does not need to be configured
################################################################################

import sys, os, logging

logging.basicConfig(filename = log_file_location, format = "%(asctime)-15s %(message)s")
log = logging.getLogger('pipeline')
log.setLevel(logging.INFO)
log.info("Restarted index.wsgi")

# Setting the path
for path in paths:
    if path not in sys.path:
        sys.path.append(path)

os.environ['PYTHONPATH'] = ":".join(filter(lambda s : s, sys.path))

# Loading handlers
try:
    from handlers import handlers
except ImportError as e:
    log.exception("Failed to import handlers")

# Import make_trace
try:
    from make_trace import make_trace
except BaseException as e:
    log.exception("Failed to import trace")

# Ongoing and finished builds
try:
    from resume_builds import resume_builds
    builds = resume_builds()
except ImportError as e:
    log.exception("Failed to resume builds")
    builds = dict()

# Global request counter
requests=0

def application(environ, start_response):
    """
    Handles the incoming request
    """

    global requests
    requests+=1
    request = int(requests)

    path = environ.get('PATH_INFO',"")

    log.info("Handling %s (request %s)" % (path, request))

    status = "200 OK"
    response_headers = [('Content-Type', 'text/plain'),
                        ('Access-Control-Allow-Origin', '*')]
    start_response(status, response_headers)

    def unknown():
        yield "No handler for path %s\n" % path

    try:
        return handlers(builds, environ).get(path.rstrip('/'), unknown)()
    except BaseException as e:
        log.exception("Error in handler code")
        return ["Error in handler code: %s\n" % e, make_trace()]

if __name__ == "__main__":
    """
    For local testing. Prefers to use eventlet because it handles concurrent
    requests, otherwise falls back on the wsgi reference implementation.
    """
    try:
        import eventlet
        from eventlet import wsgi
        log.info("Eventlet: monkey patching")
        eventlet.monkey_patch()
        log.info("Eventlet: starting server")
        wsgi.server(eventlet.listen(("", 8051)), application, minimum_chunk_size=1, max_size=100, keepalive=True)
    except ImportError, NameError:
        log.exception("Cannot find eventlet, resorting to wsgiref")
        from wsgiref.simple_server import make_server
        httpd = make_server("", 8051, application)
        httpd.serve_forever()
