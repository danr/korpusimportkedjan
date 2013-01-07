#!/bin/bash

# Four minutes of timeout: if the catapult is in use, it might take some time
# for jobs to complete to make room to respond to ping.
TIMEOUT=240

echo "\$PATH: $PATH"

PIPELINE_SOCK=/export/htdocs_sb/annoteringslabb/pipeline/pipeline.sock

cd /home/dan/annotate/webservice/catapult

diff <(timeout $TIMEOUT ./catalaunch $PIPELINE_SOCK PING) <(echo -n PONG)

ok=$?

echo "OK: " $ok

if [ $ok -ne 0 ]
then
    date; echo "RESTARING!"
    pkill -f "catapult.py"
    ./start-server.sh
fi

