# Super-fancy logging

import time

dateformat ="%Y-%m-%d %H:%M:%S"

# This function also exists in index.wsgi should this module fail to load.
def log(msg):
    print "%s: %s" % (time.strftime(dateformat), msg)

