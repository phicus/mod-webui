#!/bin/sh

xyz=$1

if [ -n "$2" ]; then
    subpath=""
fi

rsync -av --cvs-exclude --delete ./module/$subpath ${xyz}.phicus.es:/var/lib/shinken/modules/webui2/$subpath;
ssh ${xyz}.phicus.es "service shinken-broker restart; service shinken reload"
