#!/bin/bash

export PYTHONPATH=/home/dan/annotate/python${PYTHONPATH:+:$PYTHONPATH}
export PATH=/home/dan/annotate/bin:/usr/local/cwb-3.4.5/bin:/home/dan/bin:$PATH
export SB_MODELS=/home/dan/annotate/models

SALDO_MODEL=$SB_MODELS/saldo.pickle
SALDO_COMPOUND_MODEL=$SB_MODELS/saldo.compound.pickle

MALT_JAR=/home/dan/annotate/bin/maltparser-1.7.1/maltparser-1.7.1.jar
MALT_MODEL=$SB_MODELS/swemalt-1.7.mco

PROCESSES=2
VERBOSE=true

PIPELINE_DIR=/export/htdocs_sb/annoteringslabb/pipeline
CATAPULT_DIR=/home/dan/annotate/webservice/catapult

mkdir -p $PIPELINE_DIR -m 777 -v
cp $CATAPULT_DIR/Makefile* $PIPELINE_DIR -v
cp $CATAPULT_DIR/catalaunch $PIPELINE_DIR -v
chmod 755 $PIPELINE_DIR/catalaunch -v

PIPELINE_SOCK=$PIPELINE_DIR/pipeline.sock
rm -fv $PIPELINE_SOCK

echo "Starting catapult on socket $PIPELINE_SOCK in background"
python $CATAPULT_DIR/catapult.py \
    --socket_path $PIPELINE_SOCK \
    --processes $PROCESSES \
    --saldo_model $SALDO_MODEL \
    --malt_jar $MALT_JAR \
    --malt_model $MALT_MODEL \
    --compound_model $SALDO_COMPOUND_MODEL \
    --verbose $VERBOSE &> $PIPELINE_DIR/catalog &
echo "Catapult pid: $!"

# Waiting for socket to get created
inotifywait -e create $PIPELINE_DIR
chmod 777 $PIPELINE_SOCK -v
