#!/usr/bin/python
# -*- coding: utf-8 -*-

import re
from collections import OrderedDict

from shinken.misc.perfdata import PerfDatas
from shinken.objects.host import Host

app = None

def _metric_to_dict(m):
    return dict(name=m.name, value=m.value, uom=m.uom, warning=m.warning, critical=m.critical, min=m.min, max=m.max)


def show_matrix():
    return show_matrix_table()

def show_mavis_mode():
    return show_matrix_table()

def show_matrix_mode():
    return show_matrix_table()

def show_matrix_table():

    user = app.request.environ['USER']
    search = app.request.query.get('search', "type:host")
    return {'search': search}


def show_connection_request():

    user = app.request.environ['USER']
    search = app.request.query.get('search', None)
    if not search:
        search = "type:host hg:cpegpon"

    items = app.datamgr.search_hosts_and_services(search, user, get_impacts=False)

    connections = [ getattr(host,'cpe_connection_request_url','') for host in items]

    return {'connections': connections}


def show_matrix_json():

    user = app.request.environ['USER']
    #
    search = app.request.query.get('search', "type:host")
    draw = app.request.query.get('draw', "")

    start  = int(app.request.query.get('start', None) or 0)
    length = int(app.request.query.get('length', None) or 5000)


    items = app.datamgr.search_hosts_and_services(search, user, get_impacts=False)

    data = list()

    hosts = dict()

    _headers = set()
    _groups  = OrderedDict()

    #for h in items:
    #    logger.warning("busqueda::%s" % type(h) )

    hosts_items = [item for item in items if isinstance(item, Host)]

    for h in hosts_items:
        _host = h.get_name()
        if not hosts.get(_host):
            hosts[_host] = dict()

            hosts[_host]['state_id'] = h.state_id
            hosts[_host]['display_name'] = h.display_name
            hosts[_host]['services'] = {}


        if hasattr(h,'perf_data'):
            perfdatas = PerfDatas(h.perf_data)
            for m in perfdatas:
                _metric = _metric_to_dict(m)
                _name  = _metric.get('name')
                p = re.compile(r"\w+\d+")
                if p.search(_name):
                    continue
                hosts[_host][_name] = _metric
                if not _name in _headers:
                    _headers.add(_name)
                    if not _groups.get('host'):
                        _groups['host'] = list()
                    _groups['host'].append(_name)


        if hasattr(h,'cpe_registration_host') and h.cpe_registration_host:
            hosts[_host]['reg'] =  h.cpe_registration_host
        elif hasattr(h,'address') and h.address:
            hosts[_host]['reg'] = h.address

        for s in h.services:

            _group = s.get_name()
            hosts[_host]['services'][_group]=dict(state_id=s.state_id)
            if not _groups.get(_group):
                _groups[_group] = list()
            
            if _group == 'info' and s.state_id == 0:
                info_metrics = re.split("\s*(\w+):", s.output)
                if len(info_metrics) < 2:
                    continue

                if len(info_metrics) % 2 == 1:
                    info_metrics = info_metrics[1:]

                _ = iter(info_metrics)
                _metrics = dict([ (i, next(_)) for i in _ ])

                for _name,_value in _metrics.iteritems():
                    hosts[_host][_name] = _value
                    if not _name in _headers:
                        _headers.add(_name)
                        _groups[_group].append(_name)

            perfdatas = PerfDatas(s.perf_data)
            for m in perfdatas:
                _metric = _metric_to_dict(m)
                _metric.update(service_state_id=s.state_id)
                _metric.update(service=_group)
                
                _name  = _metric.get('name')
                p = re.compile(r"\w+\d+")
                if p.search(_name):
                    continue

                hosts[_host][_name] = _metric
                if not _name in _headers:
                    _headers.add(_name)
                    _groups[_group].append(_name)


    for key, value in hosts.iteritems():
        if not value:
            continue
        _temp = {'host': key}
        for _kk, _vv in value.iteritems():
            _temp[_kk] = _vv

        data.append(_temp)

    xdata = {
        'draw': draw,
        'data': data[start:int(start+length)],
        'recordsFiltered': len(data),
        'recordsTotal': len(data),
        'headers': list(_headers),
        'groups': _groups
    }

    # xdata.update(columns=[
    #     ['title', 'name'],
    #     ['title', 'value'],
    #     ['title', 'uom'],
    #     ['title', 'warning'],
    #     ['title', 'critical'],
    #     ['title', 'min'],
    #     ['title', 'max']
    # ])


    return xdata

pages = {
    show_matrix_mode: {
        'name': 'matrix', 'route': '/matrix', 'view': 'matrix', 'static': True, 'search_engine': True
    },
    show_mavis_mode: {
        'name': 'matrix', 'route': '/mavis', 'view': 'matrix', 'static': True, 'search_engine': True
    },
    show_matrix: {
        'name': 'matrix', 'route': '/matrix', 'view': 'matrix', 'static': True, 'search_engine': True
    },
    show_matrix_table: {
        'name': 'matrix', 'route': '/matrix/table', 'view': 'matrix', 'static': True, 'search_engine': True
    },
    show_matrix_json: {
        'name': 'matrix', 'route': '/matrix/json'
    }

}
