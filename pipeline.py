
import sb.util as util

import sys
import errno
import os
import shutil
import traceback

from make_makefile import makefile

def make_hash(text):
    import hashlib
    return hashlib.sha1(text).hexdigest()

def make(settings):
    from subprocess import Popen, PIPE
    util.log.info("CALL: /usr/bin/make %s", ' '.join(settings))
    return Popen(['/usr/bin/make'] + settings,
                 shell=False, close_fds=False,
                 stdin=None, stdout=PIPE, stderr=PIPE)

def take(n,xs):
    if len(xs) > n:
        return xs[:n] + "..."
    else:
        return xs

def run_pipeline(pipeline, text, settings, fmt, add_root_tag=False, incremental=False):
    """
    Runs the `text` throught the pipeline creating a makefile from `settings`.
    `pipeline` should be a dict containing 'dir', 'python' and 'processes'.
    """
    text_hash = make_hash(text)
    util.log.info('%s: "%s"', text_hash, take(100,text))
    util.log.info('%s', settings)

    text_dir = os.path.join(pipeline['dir'], text_hash)
    original_dir = os.path.join(text_dir, 'original')
    annotations_dir = os.path.join(text_dir, 'annotations')
    export_dir = os.path.join(text_dir, 'export')

    dirs = [original_dir, annotations_dir]
    for d in dirs:
        try:
            os.makedirs(d, mode=0777)
        except OSError as exc:
            if exc.errno == errno.EEXIST:
                pass
            else:
                raise
        util.system.call_binary('chmod', ['777', d, '-v'])

    with open(os.path.join(text_dir, 'Makefile'), 'w') as m:
        m.write(makefile(settings))

    text_file = os.path.join(original_dir, 'text.xml')
    if os.path.isfile(text_file):
        util.log.info("File exists and is not rewritten: %s", text_hash)
    else:
        with open(text_file, 'w') as f:
            if add_root_tag:
                f.write('<text>' + text + '</text>')
            else:
                f.write(text)

    make_settings = ['-C', text_dir,
                     'dir_chmod=777',
                     '-j', str(pipeline['processes']),
                     "python=%s" % pipeline['python']]

    if fmt == 'vrt':
        make_settings = ['vrt'] + make_settings
        out_file = os.path.join(annotations_dir, 'text.vrt')
    else:
        make_settings = ['export'] + make_settings
        out_file = os.path.join(export_dir, 'text.xml')

    try:
        os.remove(out_file)
    except OSError as exc:
        if exc.errno == errno.ENOENT:
            pass
        else:
            raise

    launches = 0
    if incremental:
        stdout, _ = make(make_settings + ['--dry-run']).communicate("")
        launches = stdout.count("catalaunch")
        yield '<result>\n'
        yield '<incremental steps="' + str(launches) + '">\n'

    process = make(make_settings)
    try:
        make_out = []
        util.log.info("Incremental: %s", incremental)

        n = 0;
        for line in iter (process.stdout.readline, ''):
            print line.rstrip()
            make_out += [line]
            if incremental and "catalaunch" in line:
                n += 1;
                yield '<increment>' + str(n) + '</increment>\n'

        if incremental:
            yield '</incremental>\n'

        # Send errors
        errs = []
        for line in iter (process.stderr.readline, ''):
            print "err:" + line.rstrip()
            yield '<error>' + line.rstrip() + '</error>\n'

        with open(out_file, 'r') as f:
            out = f.read()

        yield out

        if incremental:
            yield '</result>\n'
    except:
        traceback.print_exception(*sys.exc_info())
        for i in make_out:
            yield '<output>' + i.rstrip() + '</output>\n'
        yield '<error>Error in pipeline: "%s"</error>\n' % sys.exc_info()[1]
        return
