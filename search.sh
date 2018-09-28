#!/bin/bash

if [ $EUID != 0 ]; then
    sudo "$0" "$@"
    exit $?
fi

forever list
echo '--------'
ps
echo '--------'
echo 'nodejs processes'
ps -A | grep -P "nodejs$"
ps -A | grep -P "node$"
echo '--------'

ls -l ~/.forever/pids
