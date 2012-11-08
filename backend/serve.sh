#!/bin/bash

while true
do
	python index.wsgi &
	PID=$!
	inotifywait *.py -e modify
	kill $PID
done
