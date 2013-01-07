# Korpannoteringslabbet (Corpus Annotation Laboratory)

This project is split into three parts, the wsgi backend, the web frontend, and
the catapult which runs a python instance that shares the loaded lexicon, keeps
malt processes running and lowers the python interpreter startup time.

This project depends on the Corpus Pipeline's python scripts and Makefiles,
available from
[Språkbanken](http://spraakbanken.gu.se/swe/forskning/infrastruktur/korp/distribution/corpuspipeline).

## Backend

The backend is hosted at `demo` in `/export/htdocs_sb/annoteringslabb`, and its
subdirectory `pipeline` contains hosts running and completed builds. It is
available at [http://spraakbanken.gu.se/ws/korp/annotate](http://spraakbanken.gu.se/ws/korp/annotate).

If the backend is run with the python interpreter directly, it will try to use
the eventlet wsgi implementation if it exists. Otherwise it falls back on the
reference implementation. Eventlet is preferred because it handles concurrent
requests.

### Configuration

The `index.wsgi` has two variables at the top that needs to be configured:

 * `paths`: where the python paths to the `sb` python directory and the
   directory of the backend is, and

 * `log_file_location`: location of the log. it can be omitted to log to
   stdout.

The rest of the configuration is in `config.py`, the most important setting is
the pipeline's directory, and location of the settings schema.

## Catapult

The catapult is running on `demo`, in the
`/home/dan/annotate/webservice/catapult/` directory.

Scripts are run on the catapult with the tiny c program `catalaunch`, which
is built by issuing `make` in the `catapult` directory.

### Configuration

Directories are hard-coded into the keep alive script `keep-alive.sh`, and
the start server script `start-server.sh`. Go nuts!

## Frontend

The frontend is hosted at `k2` and available at
[http://spraakbanken.gu.se/korp/annoteringslabbet](http://spraakbanken.gu.se/korp/annoteringslabbet).

### Configuration

The `config.js` file contains the configuration of the backend's address, and
also the address to [Karp](http://spraakbanken.gu.se/karp/).

## Settings JSON Schema

The backend creates the makefile from a JSON object that must satisfy the JSON
schema stored in the backend. The frontend builds its form based on this
schema. New entries can be added and hopefully the frontend will render them
somewhat ok. The file that creates the makefile from is
`backend/make_makefile.py`.

## Cron jobs

The catapult is kept alive with `catapult/keep-alive.sh` and restarts it with
`catapult/start-server.sh` if it does not respond to ping.

Builds that have not been accessed for 24 hours are removed every midnight by
issuing [http://spraakbanken.gu.se/ws/korp/annotate/cleanup](http://spraakbanken.gu.se/ws/korp/annotate/cleanup).

The file looks like this:

    MAILTO=/dev/null
    1 0 * * * curl http://spraakbanken.gu.se/ws/korp/annotate/cleanup
    * * * * * /home/dan/annotate/webservice/catapult/keep-alive.sh

