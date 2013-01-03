#!/bin/bash

echo "\$PATH: $PATH"

PIPELINE_SOCK=/export/htdocs_sb/annoteringslabb/pipeline/pipeline.sock

cd /home/dan/annotate/webservice/catapult

diff <(timeout 30 ./catalaunch $PIPELINE_SOCK PING) <(echo -n PONG)

ok=$?

echo "OK: " $ok

if [ $ok -ne 0 ]
then
    date; echo "RESTARING!"
    pkill -f "catapult.py"
    ./start-server.sh
fi

