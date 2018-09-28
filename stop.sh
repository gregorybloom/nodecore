#!/bin/bash
if [ $EUID != 0 ]; then
    sudo "$0" "$@"
    exit $?
fi

if [ -z "$1" ]; then
	mode="development"
else
	mode="$1"
fi
#mname="nodecore_"${mode:0:3}
mname="nodecore_$mode"
echo "$mname"

forever stop "$mname"
