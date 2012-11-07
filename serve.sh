#!/bin/bash

while true
do
	python serve.py &
	PID=$!
	inotifywait *.py -e modify
	kill $PID
done
