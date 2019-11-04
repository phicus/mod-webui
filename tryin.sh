#!/bin/sh

xyz=$1

if [ -n "$2" ]; then
    subpath=""
fi

rsync -av --cvs-exclude ./module/$subpath ${xyz}.phicus.es:/var/lib/shinken/modules/webui2/$subpath;
rsync -av --cvs-exclude ../webui-plugins/* ${xyz}.phicus.es:/var/lib/shinken/modules/webui2/plugins/;

ssh ${xyz}.phicus.es "service shinken-broker restart; service shinken reload"



