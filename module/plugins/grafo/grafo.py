#!/usr/bin/python
# -*- coding: utf-8 -*-

from shinken.log import logger
from shinken.misc.perfdata import PerfDatas
from shinken.objects.service import Service
from shinken.objects.host import Host

from collections import OrderedDict

import re

app = None

def _human_byte(num, suffix='B'):
    for unit in ['','Ki','Mi','Gi','Ti','Pi','Ei','Zi']:
        if abs(num) < 1024.0:
            return "%3.1f%s%s" % (num, unit, suffix)
        num /= 1024.0
    return "%.1f%s%s" % (num, 'Yi', suffix)

def _metric_to_json(m):
    return dict(name=m.name, value=m.value, uom=m.uom, warning=m.warning, critical=m.critical, min=m.min, max=m.max)

def _host_state_to_color(id):
    if id == 0:
        return '#8BC34A'
    elif id == 1:
        return '#FAA732'
    elif id == 2:
        return '#FF7043'
    else:
        return '#49AFCD'

def _service_state_to_color(id):
    if id == 0:
        return '#8BC34A'
    elif id == 1:
        return '#FAA732'
    elif id == 2:
        return '#FF7043'
    else:
        return '#49AFCD'


def show_grafo():

    search = app.request.query.get('search', "type:host bp:>2")
    user = app.request.environ['USER']

    return {'search': search, 'user': user }


def show_grafo_json():

    data = {
        "nodes": [],
        "edges": []
    }

    hosts = set()
    locs = set()

    user = app.request.environ['USER']
    search = app.request.query.get('search', "type:host bp:>1")
    items = app.datamgr.search_hosts_and_services(search, user, get_impacts=False)
    hosts_items = [item for item in items if isinstance(item, Host)]

    # Firt Round: Host (need all host for locate orphan edge)
    for h in hosts_items:
        _host = h.get_name()
        if _host in locs:
            continue

        if len(h.parent_dependencies) > 0 or len(h.child_dependencies) > 0:
            hosts.add(_host)
            _node = {'data': {
                "id": _host,
                "name": _host,
                "address": getattr(h,'address'),
                "color": _host_state_to_color(h.state_id),
                "size": h.business_impact * 10
            }}

            _loc = h.customs.get('_LOCATION')
            if _loc:
                _node['data']["parent"] = _loc
                if not _loc in locs:
                    locs.add(_loc)
                    data.get('nodes').append({'data': {
                        "id": _loc,
                        "color": '#ddd'
                    }})

            # Node boder color, max state vale
            # max_state = 0
            # for service in h.services:
            #     border_state = max(max_state, getattr(service,'state_id'))

            if h.services:
                _node['data']['border_color'] = _service_state_to_color(max(service.state_id for service in h.services))
            else:
                _node['data']['border_color'] = _host_state_to_color(h.state_id)

            data.get('nodes').append(_node)

    # Second Round: Detect ophan edges
    for h in hosts_items:
        try: # for help debug
            _host = h.get_name()
            if _host in locs:
                continue

            edge = {'data': {}}

            if len(h.parent_dependencies) > 0:
                for parent in h.parent_dependencies:
                    _parent = parent.host_name
                    if (not _parent or
                       _parent in locs or
                       _parent not in hosts or
                       _parent == _host):
                        continue

                    edge.get('data').update({
                        "id": "{}:{}".format(_host, _parent),
                        "source": _host,
                        "target": _parent,
                        "label": '-'
                    })
            else:
                ### IF HOST IS CPE
                if hasattr(h, 'cpe_registration_host'):
                    _parent = getattr(h, 'cpe_registration_host')
                    edge.get('data').update({
                        "id": "{}:{}".format(_parent,_host),
                        "source": _host,
                        "target": _parent,
                        "color": '#3f51b5',
                        "label": '-'
                    })

            dnbw, upbw = ("-","-")
            for service in h.services:
                if hasattr(service,'perf_data'):
                    perfdatas = PerfDatas(service.perf_data)
                    for metric in perfdatas:
                        if getattr(metric,'name') == 'dnbw':
                            dnbw = _human_byte(getattr(metric,'value'))
                        if getattr(metric,'name') == 'upbw':
                            upbw = _human_byte(getattr(metric,'value'))
            perfdatas = PerfDatas(h.perf_data)
            for metric in perfdatas:
                if getattr(metric,'name') == 'dnbw':
                    dnbw = _human_byte(getattr(metric,'value'))
                if getattr(metric,'name') == 'upbw':
                    upbw = _human_byte(getattr(metric,'value'))

            edge.get('data').update(label="{}/{}".format(dnbw,upbw))

            # Cheat
            if not _host:
                pass
            elif '-REM' in _host:
                edge.get('data').update(color='#9c27b0') #ROSA
            else:
                edge.get('data').update(color='#999') # GRAY

        except Exception as e:
            edge.get('data').update(label="")
            edge.update(error=str(e))

        data.get('edges').append(edge)

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
