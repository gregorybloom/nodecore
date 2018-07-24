#!/bin/bash
if [ -z "$1" ]; then
	mode="development"
else
	mode="$1"
fi
#mname="nodecore_"${mode:0:3}
mname="nodecore_$mode"
echo "$mname"

forever stop "$mname"
