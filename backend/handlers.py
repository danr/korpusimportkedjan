from xml.sax.saxutils import escape
from threading import Thread
from Queue import Queue

import urlparse
import json
import time

from config import Config
from make_makefile import makefile
from pipeline import Build
from logger import dateformat, log
from enums import Status, Message, finished
from make_trace import make_trace

# Open JSON Schema settings and the validator.
# Location of this file is set in config.py.
from schema_utils import DefaultValidator

with open(Config.schema_file,"r") as f:
    schema_str = f.read()

settings_schema = json.loads(schema_str)
settings_validator = DefaultValidator(settings_schema)

# The handlers
def handlers(builds, environ, request):
    """
    Returns the handlers under given a builds dictionary,
    the wsgi environment and a request number.
    """
    return {
        '': lambda: handle(builds, environ, request),
        '/join': lambda: handle(builds, environ, request, 'join'),
        '/makefile': lambda: handle(builds, environ, request, 'makefile'),

        '/schema': schema,
        '/ping': ping,
        '/status': lambda: status(builds),
        '/cleanup': lambda: cleanup(builds)
    }

# Utility functions
def pretty_epoch_time(t):
    """
    Prints an epoch time using the logger's dateformat
    """
    return time.strftime(dateformat, time.localtime(t))

def query(environ, key, default):
    """
    Caches the environment dictionary, and returns the value of a given key,
    or the default value if it does not exist.
    """
    if 'query_dict' not in environ:
        environ['query_dict'] = urlparse.parse_qs(environ.get('QUERY_STRING',""))
    return environ['query_dict'].get(key, [default])[0]

def text(environ):
    """
    Either get the POST content, or from the "text" query variable.
    """
    try:
        length = int(environ.get('CONTENT_LENGTH', '0'))
    except ValueError:
        length = 0

    if length != 0:
        return environ['wsgi.input'].read(length)
    else:
        return query(environ, 'text', '')

def mk_putstr(build_hash, request):
    """
    Put string message with a request number
    """
    def putstr(msg):
        log("%s (%d) %s" % (build_hash, request, msg))
    return putstr

# /schema handler
def schema():
    yield schema_str

# /status handler
def status(builds):
    """
    Status of builds
    """
    for h, b in builds.iteritems():
        yield ("<build hash='%s' status='%s' since='%s' accessed='%s' accessed-secs-ago='%s'/>\n" %
                (h, Status.lookup[b.status],
                    pretty_epoch_time(b.status_change_time),
                    pretty_epoch_time(b.accessed_time),
                    round(time.time() - b.accessed_time,1)))

# /cleanup handler
def cleanup(builds, timeout=86400):
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

# /ping handler
ping_error_msg = """<error>
<catapult time='%s'>
<stdout>%s</stdout>
<stderr>%s</stderr>
</catapult>
</error>
"""

def ping():
    """
    Ping this script, responds with the status of the catapult.
    """
    try:
        t0 = time.time()
        from subprocess import Popen, PIPE
        cmd = [Config.catalaunch_binary, Config.socket_file, "PING"]
        stdout, stderr = Popen(cmd, stdout=PIPE, stderr=PIPE).communicate()
        t1 = time.time()
    except BaseException as e:
        yield "<error>Failed to ping catapult: %s</error>\n" % e
    else:
        t = round(t1 - t0,4)
        if not stderr and stdout == "PONG":
            yield "<catapult time='%s'>%s</catapult>\n" % (t, stdout)
        else:
            yield ping_error_msg % (t, stdout, stderr)

# Starting and joining builds
def build(builds, original_text, settings, incremental, fmt, request):
    """
    Starts a build for this corpus. If it is already running,
    joins it. Messages from the build is received on a queue.
    """

    build = Build(original_text, settings)

    putstr = mk_putstr(build.build_hash, request)

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

def join_from_hash(builds, hashnumber, incremental, request):
    """
    Joins a build with a given hash number if it exists.
    """
    build = builds.get(hashnumber, None)
    if build is not None:
        return join_build(build, incremental, mk_putstr(hashnumber, request))
    else:
        def error():
            yield "<error>No such build!</error>\n</result>\n"
        return error()

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
        return build.result() + '</result>\n'

    # Send this build's hash
    yield "<build hash='%s'/>\n" % build.build_hash

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

# /, /makefile and /join handlers
def handle(builds, environ, request, cmd=None):
    error = None

    try:
        settings = json.loads(query(environ, 'settings', '{}'))
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
        yield '<result>\n<error>' + error + '</error>\n</result>\n'
    else:
        incremental = query(environ, 'incremental', '')
        incremental = incremental.lower() == 'true'

        if cmd == "makefile":
            yield makefile(settings)
        elif cmd == "join":
            log("Joining, sending result start")
            yield "<result>\n"
            hashnumber = query(environ, 'hash', '')
            for k in join_from_hash(builds, hashnumber, incremental, request):
                yield k
        else:
            log("Sending result start")
            yield "<result>\n"

            try:
                for k in build(builds, text(environ), settings, incremental, "xml", request):
                    yield k

            except:
                trace = make_trace()
                log(trace)
                yield '<trace>' + escape(trace) + '</trace>\n'
                yield '</result>\n'

