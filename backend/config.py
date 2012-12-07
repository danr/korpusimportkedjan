################################################################################
#
# Pipeline Configuration
#
# Besides this configuration, there are also a few variables in the top
# of index.wsgi that needs to be configured.
#
################################################################################
import os

class Config(object):
    """Static pipeline settings"""

    # Where the pipeline is hosted
    directory = '/export/htdocs_sb/annoteringslabb/pipeline'

    # Where the models are hosted (SB_MODELS)
    sb_models = os.environ.get('SB_MODELS','/home/dan/annotate/models')

    # Location of the JSON schema for makefile settings
    schema_file = "/export/htdocs_sb/annoteringslabb/settings_schema.json"

    # The number of processes (sent as a -j flag to make)
    processes = 2

    # Socket file
    socket_file = os.path.join(directory, 'pipeline.sock')

    # The catalaunch binary
    catalaunch_binary = os.path.join(directory, 'catalaunch')

    # The "python" interpreter, replaced with catalaunch
    python_interpreter = catalaunch_binary + " " + socket_file



