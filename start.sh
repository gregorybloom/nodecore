#!/bin/bash
PROGNAME=${0}
PROGVERSION=0.9.0

usage()
{
  cat << EO
        Usage: $PROGNAME [options]
               $PROGNAME -o <version> -c

        Increase the .deb file's version number, noting the change in the'


        Options:
EO
  cat <<EO | column -s\& -t

        -h|--help & show this output
        -V|--version & show version information
EO
}
SHORTOPTS="hvl:"
LONGOPTS="help,version,label:"

ARGS=$(getopt -s bash --options $SHORTOPTS  \
  --longoptions $LONGOPTS --name $PROGNAME -- "$@" )

	eval set -- "$ARGS"

#	defmode="default"
	runlabel="default"
	while true; do
	   case $1 in
	      -h|--help)
	         usage
	         exit 0
	         ;;
	      -v|--version)
	         echo "$PROGVERSION"
	         ;;
#	      -a)
#	         shift
#	         echo "$1"
#	         ;;
				-l|--label)
        # this is not in use
					 shift
					 runlabel="$1"
					 ;;
	#      --)
	#         shift
	#         break
	#         ;;
	      *)
	         shift
	         break
	         ;;
	   esac
	   shift
	done




if [ -z "$1" ]; then
	mode="development"
else
	mode="$1"
fi

if [[ "$mode" == "development" ]]; then
	serverpath="source"
else
	serverpath="branches/$mode/source"
fi

#mname="nodecore_"${mode:0:3}
mname="nodecore_$mode"
echo "$mname"

forever stop "$mname"

rm ~/.forever/"$mname.log"

LAUNCH="$mode" forever start --uid "$mname" "$serverpath/server.js"
