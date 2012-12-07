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

import sys, time,  os

# Making a debug writer object.

class Writer(object):
    def __init__(self, mode='a'):
        if log_file_location is not None:
            self.log = open(log_file_location, mode)
            sys.stdout = self
            sys.stderr = self
            self.active = True
        else:
            self.active = False

    def write(self, msg):
        if self.active:
            self.log.write(msg)
            self.flush()

    def flush(self):
        if self.active:
            self.log.flush()

    def close(self):
        if self.active:
            self.log.close()

def log(msg):
    """
    Drop-in-replacement for log in logger.py if that module cannot be loaded
    """
    print "%s: %s" % (time.strftime("%Y-%m-%d %H:%M:%S"), msg)

w = Writer()
log("Restarted index.wsgi")
w.flush()

# Setting the path
for path in paths:
    if path not in sys.path:
        sys.path.append(path)

os.environ['PYTHONPATH'] = ":".join(filter(lambda s : s, sys.path))

# Loading handlers
try:
    from handlers import handlers
except ImportError as e:
    log("Failed to import handlers")
    log(e)

# Import make_trace
try:
    from trace import make_trace
except BaseException as e:
    log("Failed to import trace")
    log(e)

# Ongoing and finished builds
builds = dict() # TODO: This could load builds from earlier invocations
                #       in the pipeline directory.

# Global request counter
requests=0

def application(environ, start_response):
    """
    Handles the incoming request
    """

    # Need to start a new logger here
    w = Writer()
    log("Continuing index.wsgi")
    w.flush()

    global requests
    requests+=1
    request = int(requests)

    path = environ.get('PATH_INFO',"")

    log("(%s): %s" % (request, path))

    status = "200 OK"
    response_headers = [('Content-Type', 'text/plain'),
                        ('Access-Control-Allow-Origin', '*')]
    start_response(status, response_headers)

    def unknown():
        yield "No handler for path %s" % path

    try:
        return handlers(builds, environ, request).get(path.rstrip('/'), unknown)()
    except e:
        def error():
            yield "Error in handler code: %s" % e
            yield make_trace()
        map(log, error)
        return error()

if __name__ == "__main__":
    """
    For local testing. Prefers to use eventlet because it handles concurrent
    requests, otherwise falls back on the wsgi reference implementation.
    """
    try:
        import eventlet
        from eventlet import wsgi
        eventlet.monkey_patch()
        wsgi.server(eventlet.listen(("", 8051)), application, minimum_chunk_size=1, max_size=100, keepalive=True)
    except ImportError, NameError:
        from wsgiref.simple_server import make_server
        httpd = make_server("", 8051, application)
        httpd.serve_forever()
