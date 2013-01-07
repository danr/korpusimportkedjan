#!/bin/bash

export PYTHONPATH=/home/dan/annotate/python${PYTHONPATH:+:$PYTHONPATH}

cd /home/dan/annotate/models

make clean
make all

# Kill the catapult: keep-alive.sh cronjob will resurrect it
pkill -f "catapult.py"

