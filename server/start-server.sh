#!/bin/bash

SALDO_MODEL=$SB_MODELS/saldo_small.pickle
SALDO_COMPOUND_MODEL=$SB_MODELS/saldo.compound.pickle

MALT_JAR=/home/dan/code/annotate/bin/maltparser-1.7.1/maltparser-1.7.1.jar
MALT_MODEL=$SB_MODELS/swemalt-1.7.mco

PROCESSES=2
VERBOSE=true

export PIPELINE_DIR=/dev/shm/pipeline
export MAKEFILE_DIR=/home/dan/code/annotate/pipeline

rm -rf $PIPELINE_DIR
mkdir -p $PIPELINE_DIR -m 777 -v

cp $MAKEFILE_DIR/Makefile* $PIPELINE_DIR -v

cp $MAKEFILE_DIR/catalaunch $PIPELINE_DIR -v
chmod 755 $PIPELINE_DIR/catalaunch -v

PIPELINE_SOCK=$PIPELINE_DIR/pipeline.sock
rm -fv $PIPELINE_SOCK

echo "Starting catapult on socket $PIPELINE_SOCK in background"
echo "This process can be killed with stop_server"
python catapult.py \
    --socket_path $PIPELINE_SOCK \
    --processes $PROCESSES \
    --saldo_model $SALDO_MODEL \
    --compound_model $SALDO_COMPOUND_MODEL \
    --malt_jar $MALT_JAR \
    --malt_model $MALT_MODEL \
    --verbose $VERBOSE &
CATAPULT_PID=$!
echo "Catapult pid: $CATAPULT_PID"

inotifywait -e create $PIPELINE_DIR
chmod 777 $PIPELINE_SOCK -v
