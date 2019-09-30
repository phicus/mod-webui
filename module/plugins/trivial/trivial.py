#!/usr/bin/python
# -*- coding: utf-8 -*-

from shinken.log import logger
from shinken.misc.perfdata import PerfDatas
from shinken.objects.service import Service
from shinken.objects.host import Host

from collections import OrderedDict

import re
import json

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
        return '#5bb75b' #'#8BC34A'
    elif id == 1:
        return '#da4f49'
    elif id == 2:
        return '#faa732'
    else:
        return '#49afcd'

def _service_state_to_color(id):
    if id == 0:
        return '#5bb75b' #'#8BC34A'
    elif id == 1:
        return '#faa732'
    elif id == 2:
        return '#da4f49'
    else:
        return '#49afcd'


def show_trivial():

    user   = app.request.environ.get('USER')
    search = app.request.query.get('search', None)
    if not search:
        search = "type:host bp:>2"


    return {'search': search, 'user': user }


def show_trivial_json():

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
                "size": h.business_impact * 25,
                "tech": h.customs.get('_TECH',""),
                "model": h.customs.get('_MODEL',""),
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

            _node['data']['service0'] = 0
            _node['data']['service1'] = 0
            _node['data']['service2'] = 0
            _node['data']['service3'] = 0
            _node['data']['servicen'] = len(h.services)

            for s in h.services:
                _node['data']['service%d' % s.state_id] += 1

            if len(h.hostgroups) > 0:
                _node['classes'] = " ".join([hg.get_name() for hg in h.hostgroups ])

            data.get('nodes').append(_node)

    # Second Round: Generate edges
    for h in hosts_items:
        try: # for help debug
            _host = h.get_name()
            if _host in locs:
                continue

            edge = {'data': {}}

            if len(h.parent_dependencies) > 0:
                for parent in h.parent_dependencies:
            #if len(h.child_dependencies) > 0:
            #    for parent in h.child_dependencies:
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

                    if (not _parent or
                       _parent in locs or
                       _parent not in hosts or
                       _parent == _host):
                        continue


                    edge.get('data').update({
                        "id": "{}:{}".format(_parent,_host),
                        "source": _host,
                        "target": _parent,
                        "color": '#3f51b5',
                        "label": '',
                        "cpe": True
                    })

            dnbw, upbw = (None,None)
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

            if (dnbw and upbw):
                edge.get('data').update(label="{}/{}".format(dnbw,upbw))

            # Cheat
                # if not _host:
                #     pass
                # elif '-REM' in _host:
                #     edge.get('data').update(color='#9c27b0') #ROSA
                # else:
                #     edge.get('data').update(color='#999') # GRAY

            if len(h.hostgroups) > 0:
                edge['classes'] = " ".join([hg.get_name() for hg in h.hostgroups ])

        except Exception as e:
            edge.get('data').update(label="")
            edge.update(error=str(e))

        data.get('edges').append(edge)

    return data


def set_trivial_setting():
    data = json.load(app.request.body or '{}')
    saved_data = get_trivial_setting()
    saved_data.update(data)
    app.prefs_module.set_ui_common_preference('trivial', json.dumps(saved_data))

    return {'status': 'ok'}

def get_trivial_setting():
    # Do not work
    # app.response.content_type = 'application/octet-stream'
    # Do not work
    # app.bottle.response.content_type = 'application/octet-stream'
    # Do not work
    # app.response.set_header("Content-Type", 'application/octet-stream')
    # It works
    # app.response.set_header("Test-Header", 'Some awesome value')
    return json.loads(app.prefs_module.get_ui_common_preference('trivial') or '{}')


def get_parents():
    query_user = app.request.environ.get('USER')
    query_host = app.request.query.get('host', None)
    if not query_host:
        app.response.status = 400
        return "Error: 400 Bad Request"

    host = app.datamgr.get_host(query_host, query_user)
    if not host:
        app.response.status = 404
        return "Error: 404 Not Found\n\tCould not find host: " + query_host
    parents = host.parents
    return {'parents': parents}

pages = {
    set_trivial_setting: {
        'name': 'SetTrivialSetting', 'route': '/trivial/settings/save', 'method': 'POST'
    },

    get_trivial_setting: {
        'name': 'GetTrivialSettings', 'route': '/trivial/settings/load', 'method': 'GET'
    },

    show_trivial: {
        'name': 'trivial', 'route': '/trivial', 'view': 'trivial', 'static': True,
        'search_engine': True
    },
    show_trivial_json: {
        'name': 'trivial', 'route': '/trivial.json', 'search_engine': True
    },
    get_parents: {
        'name': 'parents', 'route': '/trivial/parents', 'method': 'GET', 'search_engine': True
    },
}
