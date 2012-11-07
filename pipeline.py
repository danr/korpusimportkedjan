
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

def pipeline(pipeline_dir, processes, text, settings, fmt, add_root_tag=False, incremental=False):
    text_hash = make_hash(text)
    util.log.info('%s: "%s"', text_hash, text)

    text_dir = os.path.join(pipeline_dir, text_hash)
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

    make_settings = ['-C', text_dir, 'dir_chmod=777', '-j', str(processes)]

    if fmt == 'vrt':
        make_settings += ['vrt']
        out_file = os.path.join(annotations_dir, 'text.vrt')
    else:
        make_settings += ['export']
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
        stdout, _ = util.system.call_binary('/usr/bin/make', make_settings + ['--dry-run'], verbose=True)
        launches = stdout.count("catalaunch")
        yield '<result>\n'
        yield '<incremental steps="' + str(launches) + '">\n'

    from subprocess import Popen, PIPE
    cmd = Popen(['/usr/bin/make'] + ['vrt'] + make_settings,
                shell=False, close_fds=False,
                stdin=PIPE, stdout=PIPE, stderr=PIPE)
    try:
        make_out = []
        util.log.info("Incremental: %s", incremental)

        n = 0;
        for line in iter (cmd.stdout.readline, ''):
            print line
            make_out += [line]
            if incremental and "catalaunch" in line:
                n += 1;
                yield '<increment>' + str(n) + '</increment>\n'

        if incremental:
            yield '</incremental>\n'

        # Send errors
        errs = []
        for line in iter (cmd.stderr.readline, ''):
            print "err:" + line
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
