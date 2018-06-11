#!/usr/bin/python
# -*- coding: utf-8 -*-

from shinken.log import logger
from shinken.misc.perfdata import PerfDatas
from shinken.objects.service import Service
from shinken.objects.host import Host

from collections import OrderedDict

import re

app = None

def show_grafo():
    return {}


def show_grafo_json():

    user = app.request.environ['USER']

    search = app.request.query.get('search', "type:host bp:>1")
    items = app.datamgr.search_hosts_and_services(search, user, get_impacts=False)

    hosts_items = [item for item in items if isinstance(item, Host)]

    data = {
        "nodes": [],
        "links": []
    }


    data.get('nodes').append({
        "id": 'zero',
        "state_id": 3,
        "business_impact": 4
    })

    hosts = set()

    for h in hosts_items:
        _host = h.get_name()
        hosts.add(_host)
        data.get('nodes').append({
            "id": _host,
            "state_id": h.state_id,
            "business_impact": h.business_impact
        })

        if len(h.parent_dependencies) > 0:
            for parent in h.parent_dependencies:
                data.get('links').append({
                    "source": _host,
                    "target": parent.host_name,
                    "value": 1
                })
                # if not parent.host_name in hosts:
                #     hosts.add(_host)
                #     data.get('nodes').append({
                #         "id": parent.host_name,
                #         "state_id": 4,
                #         "business_impact": 1
                #     })
        else:
            data.get('links').append({
                "source": _host,
                "target": 'zero',
                "value": 1
            })

    return data


pages = {
    show_grafo: {
        'name': 'grafo', 'route': '/grafo', 'view': 'grafo', 'static': True,
        'search_engine': True
    },

    show_grafo_json: {
        'name': 'grafo', 'route': '/grafo.json', 'search_engine': True
    }


}
