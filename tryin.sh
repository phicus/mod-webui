#!/bin/sh

xyz=$1

if [ -n "$2" ]; then
    subpath=""
fi

rsync -av --cvs-exclude ./module/$subpath root@${xyz}.phicus.es:/var/lib/shinken/modules/webui2/$subpath;
rsync -av --cvs-exclude ../webui-plugins/* root@${xyz}.phicus.es:/var/lib/shinken/modules/webui2/plugins/ --exclude node_modules;

ssh ${xyz}.phicus.es "sudo service shinken-broker restart"



