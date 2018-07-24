#!/bin/bash

forever list
echo '--------'
ps
echo '--------'
echo 'nodejs processes'
ps -A | grep -P "nodejs$"
ps -A | grep -P "node$"
echo '--------'

ls -l ~/.forever/pids
