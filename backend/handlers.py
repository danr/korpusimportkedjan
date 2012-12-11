from Queue import Queue
from threading import Thread
from xml.sax.saxutils import escape

import logging
import json
import time

from build import Build
from config import Config
from enums import Status, Message, finished
from make_makefile import makefile
from make_trace import make_trace
from schema_utils import DefaultValidator
from utils import pretty_epoch_time, query, text

log = logging.getLogger('pipeline.' + __name__)

# The handlers
def handlers(builds, environ):
    """
    Returns the handlers with a builds dictionary, and wsgi environment
    """
    return {
        '': lambda: handle(builds, environ),
        '/join': lambda: handle(builds, environ, 'join'),
        '/makefile': lambda: handle(builds, environ, 'makefile'),

        '/api': api,

        '/schema': schema,
        '/ping': ping,
        '/status': lambda: status(builds),
        '/cleanup': lambda: cleanup(builds),
        '/cleanup/errors': lambda: cleanup(builds, remove_errors=True)
    }

# Open JSON Schema settings and the validator.
# Location of this file is set in config.py.
try:
    with open(Config.schema_file,"r") as f:
        schema_str = f.read()
except:
    log.exception("Error reading JSON schema settings file")
    schema_str = "{}"

try:
    settings_schema = json.loads(schema_str)
except:
    log.exception("Error parsing JSON is schema settings")
    settings_schema = {}

try:
    settings_validator = DefaultValidator(settings_schema)
except:
    log.exception("Error starting validator for JSON schema settings")

# /schema handler
def schema():
    yield schema_str

# /status handler
def status(builds):
    """
    Status of builds
    """
    res = ""
    for h, b in builds.iteritems():
        if b.status is not None:
            res += ("<build hash='%s' status='%s' since='%s' accessed='%s' accessed-secs-ago='%s'/>\n" %
                       (h, Status.lookup[b.status],
                           pretty_epoch_time(b.status_change_time),
                           pretty_epoch_time(b.accessed_time),
                           round(time.time() - b.accessed_time,1)))

    return [res]

# /cleanup handler
def cleanup(builds, timeout=86400, remove_errors=False):
    """
    Removes builds that are finished and haven't been accessed within the timeout,
    which is by default 24 hours.

    With remove_errors, removes the all with status Error.
    """
    to_remove = []
    for h, b in builds.iteritems():
        if (finished(b.status) and time.time() - b.accessed_time > timeout
            or b.status == Status.Error and remove_errors):
            log.info("Removing %s" % h)
            b.remove_files()
            to_remove.append(h)
    res = ""
    for h in to_remove:
        del builds[h]
        res += "<removed hash='%s'>\n" % h
    return [res]

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
        return ["<error>Failed to ping catapult: %s</error>\n" % e]
    else:
        t = round(t1 - t0,4)
        if not stderr and stdout == "PONG":
            return ["<catapult time='%s'>%s</catapult>\n" % (t, stdout)]
        else:
            return [ping_error_msg % (t, stdout, stderr)]

# Starting and joining builds
def build(builds, original_text, settings, incremental, fmt):
    """
    Starts a build for this corpus. If it is already running,
    joins it. Messages from the build is received on a queue.
    """

    build = Build(original_text, settings)

    # Start build or listen to existing build
    if build.build_hash not in builds:
        log.info("Starting a new build")
        builds[build.build_hash] = build
        build.make_files()
        t = Thread(target=Build.run, args=[build, fmt])
        t.start()
    else:
        build = builds[build.build_hash]
        log.info("Joining existing build which started at %s" %
                  pretty_epoch_time(build.status_change_time))

    return join_build(build, incremental)

def join_from_hash(builds, hashnumber, incremental):
    """
    Joins a build with a given hash number if it exists.
    """
    build = builds.get(hashnumber, None)
    if build is not None:
        return join_build(build, incremental)
    else:
        def error():
            yield "<error>No such build!</error>\n</result>\n"
        return error()

def join_build(build, incremental):
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
        log.info("Result already exists since %s" %
                 pretty_epoch_time(build.status_change_time))
        yield get_result()

    # Listen for completion
    else:

        if incremental and build.status == Status.Running:
            log.info("Already running, sending increment message")
            yield build.increment_msg()

        while True:
            msg_type, msg = queue.get()
            if msg_type == Message.StatusChange:
                log.info("Message %s" % Status.lookup[msg])
            # Has status changed to finished?
            if msg_type == Message.StatusChange:
                if finished(msg):
                    break
            # Increment message
            elif incremental and msg_type == Message.Increment:
                yield msg

        log.info("Getting result...")
        yield get_result()

# /, /makefile and /join handlers
def handle(builds, environ, cmd=None):
    error = None

    try:
        settings = json.loads(query(environ, 'settings', '{}'))
    except:
        log.exception("Error in json parsing the settings variable")
        error = escape(make_trace())
        settings = {}

    for e in sorted(settings_validator.iter_errors(settings)):
        if error is None:
            error = ""
        error += str(e) + "\n"

    if error is not None:
        log.error("Errors from schema: " + error)
        yield '<result>\n<error>' + error + '</error>\n</result>\n'
    else:
        incremental = query(environ, 'incremental', '')
        incremental = incremental.lower() == 'true'

        try:
            if cmd == "makefile":
                log.info("Returning makefile")
                yield makefile(settings)
            elif cmd == "join":
                log.info("Joining existing build")
                yield "<result>\n"
                hashnumber = query(environ, 'hash', '')
                for k in join_from_hash(builds, hashnumber, incremental):
                    yield k
            else:
                log.info("Starting a new build")
                yield "<result>\n"
                for k in build(builds, text(environ), settings, incremental, "xml"):
                    yield k
        except:
            trace = make_trace()
            log.exception("Error in handle")
            yield '<trace>' + escape(trace) + '</trace>\n'
            yield '</result>\n'

def api():
    with open("api.json", "r") as f:
        api = f.read()
    return [api]

