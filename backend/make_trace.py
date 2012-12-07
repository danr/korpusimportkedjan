################################################################################
#
# Makes a traceback
#
################################################################################

def make_trace():
    from sys import exc_type, exc_value, exc_traceback
    import traceback
    return "".join(traceback.format_exception(exc_type, exc_value, exc_traceback))
