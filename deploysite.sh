#!/bin/bash

checkvalue () {
	var="$1"

	echo "$var" | grep -oP "[^-\w\d_.]"

	if echo "$var" | grep --quiet -oP "[^-\w\d_.]"; then
		return 0
	fi
	return 1
}


orig="development"
rebootserver=0

OPTIND=1
while getopts "o:r" OPTION; do
	case $OPTION in
		o) orig="$OPTARG";;
		r) rebootserver=1;;
		\?) echo "Invalid option: -$OPTARG"; return 1;;
	esac
done
shift $((OPTIND-1))

if [ -z "$1" ]; then
	dest="production"
else
	dest="$1"
fi

if checkvalue "$orig"; then exit; fi
if checkvalue "$dest"; then exit; fi


if [[ "$dest" == "development" ]]; then
	destpath="source"
else
	destpath="branches/$dest"
fi
if [[ "$orig" == "development" ]]; then
	origpath="source"
else
	origpath="branches/$orig"
fi

echo "copying $origpath to $destpath"

if [[ "$rebootserver" = 1 ]]; then
	/bin/bash ./stop.sh "$dest"
fi

rm -Rv "$destpath/source"
mkdir -p "$destpath"

cp -Rv "$origpath/" "$destpath/"

if [[ "$rebootserver" = 1 ]]; then
	/bin/bash ./start.sh "$dest"
fi
