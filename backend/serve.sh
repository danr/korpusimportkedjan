#!/bin/bash

while true
do
	python index.wsgi &
	PID=$!
	inotifywait * -e modify
	kill $PID
done
