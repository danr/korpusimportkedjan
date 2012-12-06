# -*- mode: python; coding: utf-8 -*-

################################################################################
#
# Making a debug object
#
################################################################################
import sys, time

class Writer(object):
    def __init__(self, mode='a'):
        self.log = open("/export/htdocs_sb/annoteringslabb/pipeline/annotate.log", mode)
        sys.stdout = self
        sys.stderr = self

    def write(self, msg):
        self.log.write(msg)
        self.flush()

    def flush(self):
        self.log.flush()

    def close(self):
        self.log.close()

dateformat = "%Y-%m-%d %H:%M:%S"
def log(msg):
    print "%s: %s" % (time.strftime(dateformat), msg)

def pretty_epoch_time(t):
    return time.strftime(dateformat, time.localtime(t))

w = Writer()
log("Restarted index.wsgi")
w.flush()

################################################################################
#
# Append path to annotate and backend
#
################################################################################
paths = ['/home/dan/annotate/python','/export/htdocs_sb/annoteringslabb/']
for path in paths:
    if path not in sys.path:
        sys.path.append(path)

import os
os.environ['PYTHONPATH'] = ":".join(filter(lambda s : s, sys.path))

################################################################################
#
# Pipeline Settings
#
################################################################################
class PipelineSettings(object):
    """Static pipeline settings"""

    # Where the pipeline is hosted
    directory = '/export/htdocs_sb/annoteringslabb/pipeline'

    # Socket file
    socket_file = os.path.join(directory, 'pipeline.sock')

    # The catalaunch binary
    catalaunch_binary = os.path.join(directory, 'catalaunch')

    # The "python" interpreter, replaced with catalaunch
    python_interpreter = catalaunch_binary + " " + socket_file

    # The number of processes (sent as a -j flag to make)
    processes = 2

pipeline_settings = PipelineSettings()

################################################################################
#
# Pipeline Environment Settings
#
################################################################################
# Where the models are hosted. Replaces SB_MODELS environment variable if it does not exist
os.environ['SB_MODELS'] = os.environ.get('SB_MODELS','/home/dan/annotate/models')

# No remote installations allowed
os.environ['remote_cwb_datadir']="null"
os.environ['remote_cwb_registry']="null"
os.environ['remote_host']="null"

################################################################################
#
# Loading local modules
#
################################################################################
try:
    from make_makefile import makefile
    from pipeline import Build, Status, Message, finished, make_trace
except BaseException as e:
    log("Failed to import local modules")
    log(e)


################################################################################
#
# General imports
#
################################################################################

try:
    from xml.sax.saxutils import escape
    from threading import Thread
    from Queue import Queue

    import urlparse
    import json
except BaseException as e:
    log("Failed general imports")
    log(e)
    log(make_trace())

################################################################################
#
# Open JSON Schema settings and the validator
#
################################################################################
try:
    from schema_utils import DefaultValidator

    with open("/export/htdocs_sb/annoteringslabb/settings_schema.json","r") as f:
        schema_str = f.read()

    settings_schema = json.loads(schema_str)
    settings_validator = DefaultValidator(settings_schema)
except BaseException as e:
    log("Failed to open JSON schema or making the default validator")
    log(e)
    log(make_trace())


################################################################################
#
# Ongoing and finished builds
#
################################################################################
builds = dict()

def builds_status():
    for h, b in builds.iteritems():
        yield ("<build hash='%s' status='%s' since='%s' accessed='%s' accessed-secs-ago='%s'/>\n" %
                (h, Status.lookup[b.status],
                    pretty_epoch_time(b.status_change_time),
                    pretty_epoch_time(b.accessed_time),
                    round(time.time() - b.accessed_time,1)))

def builds_cleanup(timeout=86400):
    """
    Removes builds that are finished and haven't been accessed within the timeout,
    which is by default 24 hours.
    """
    to_remove = []
    for h, b in builds.iteritems():
        if finished(b.status) and time.time() - b.accessed_time > timeout:
            log("Removing %s" % h)
            b.remove_files()
            to_remove.append(h)
    for h in to_remove:
        del builds[h]
        yield "<removed hash='%s'>\n" % h

################################################################################
#
# Ping
#
################################################################################

def ping():
    try:
        t0 = time.time()
        from subprocess import Popen, PIPE
        cmd = [pipeline_settings.catalaunch_binary, pipeline_settings.socket_file, "PING"]
        stdout, stderr = Popen(cmd, stdout=PIPE, stderr=PIPE).communicate()
        t1 = time.time()
    except e:
        yield "<error>Failed to ping catapult</error>\n"
    else:
        t = round(t1 - t0,4)
        if not stderr and stdout == "PONG":
            yield "<catapult time='%s'>%s</catapult>\n" % (t, stdout)
        else:
            yield """<error>
<catapult time='%s'>
<stdout>%s</stdout>
<stderr>%s</stderr>
</catapult>
</error>
""" % (t, stdout, stderr)

################################################################################
#
# Eh, global request counter
#
################################################################################

request=0

################################################################################
#
# Utility functions for running the pipeline
#
################################################################################

def mk_putstr(build_hash, request_number):
    def putstr(msg):
        log("%s (%d) %s" % (build_hash, request, msg))
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
        build = builds[build.build_hash]
        putstr("Joining existing build which started at %s" %
                pretty_epoch_time(build.status_change_time))

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
        build.access()
        if incremental:
            return build.result() + '</result>\n'
        else:
            return '<result>\n' + build.result() + '</result>\n'


    # Result already exists
    if finished(build.status):
        putstr("Result already exists since %s" %
                pretty_epoch_time(build.status_change_time))
        yield get_result()

    # Listen for completion
    else:
        if incremental and build.status == Status.Running:
            putstr("Already running, sending increment message")
            yield build.increment_msg()

        while True:
            msg_type, msg = queue.get()
            if msg_type == Message.StatusChange:
                putstr("Message %s" % Status.lookup[msg])
            # Has status changed to finished?
            if msg_type == Message.StatusChange:
                if finished(msg):
                    break
            # Increment message
            elif incremental and msg_type == Message.Increment:
                yield msg

        putstr("Getting result...")
        yield get_result()

################################################################################
#
# Application function
#
################################################################################

def application(environ, start_response):
    """
    Parses the data, but most processing is done in the function build
    """
    w = Writer()
    log("Continuing index.wsgi")
    w.flush()
    global request
    request+=1

    query_dict = urlparse.parse_qs(environ.get('QUERY_STRING',""))

    paths = environ.get('PATH_INFO',"").split("/")

    log("(%s): %s %s" % (request, "/".join(paths), query_dict))

    post = ""
    try:
        length = int(environ.get('CONTENT_LENGTH', '0'))
    except ValueError:
        length = 0
    if length != 0:
        post = environ['wsgi.input'].read(length)

    if length == 0:
        post = query_dict.get('text', [''])[0]

    error = None

    try:
        settings = json.loads(query_dict.get('settings',['{}'])[0])
    except:
        error = escape(make_trace())
        settings = {}

    for e in sorted(settings_validator.iter_errors(settings)):
        if error is None:
            error = ""
        log(e)
        error += str(e) + "\n"

    if error is not None:
        log(error)
        status = '400 Bad Request'
        response_headers = [('Content-Type', 'text/plain'),
                            ('Access-Control-Allow-Origin', '*')]

        start_response(status, response_headers)
        yield '<result>\n<error>' + error + '</error>\n</result>\n'
    else:
        status = '200 OK'
        response_headers = [('Content-Type', 'text/plain'),
                            ('Access-Control-Allow-Origin', '*')]

        start_response(status, response_headers)

        if "makefile" in paths:
            yield makefile(settings)
        elif "schema" in paths:
            yield schema_str
        elif "ping" in paths:
            for k in ping():
                yield k
        elif "status" in paths:
            for k in builds_status():
                yield k
        elif "cleanup" in paths:
            for k in builds_cleanup():
                yield k
        else:
            incremental = query_dict.get('incremental', [''])[0]
            incremental = incremental.lower() == 'true'

            if incremental:
                print "Sending result start"
                yield "<result>\n"

            try:
                for k in build(post, settings, incremental, "xml", int(request)):
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
