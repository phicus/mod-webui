#!/usr/bin/python

# -*- coding: utf-8 -*-

import json
import random
import time
import requests
from shinken.log import logger
from libkrill.config import Config as KrillConfig

def oratio_proxy(filepath):

    url = app.request.url
    path = "/".join(url.split('/')[4:])
    port = app.request.GET.pop('_oratio_port', 4250)
    host = KrillConfig().get_family('variables').get('freeradius_ip_lan')

    oratio_url = "http://{}:{}/{}".format(host,port,path)

    try:
        r = requests.get(oratio_url, params=app.request.GET)
        if r.status_code != 200:
            logger.error("[oratio-proxy]  not found: %d - %s", r.status_code, url)
            app.bottle.response.status = r.status_code
            app.bottle.response.content_type = 'application/json'
            return json.dumps(
                {'status': 'ko', 'message': r.content}
            )

    except Exception as e:
        logger.error("[oratio-proxy] exception: %s", str(e))
        app.bottle.response.status = 500
        app.bottle.response.content_type = 'application/json'
        return json.dumps(
            {'status': 'ko', 'message': str(e)}
        )

    app.bottle.response.content_type = str(r.headers['content-type'])
    return r.content

def show_radius():
    ''' Mostrar radius.'''

    return {}

pages = {
    oratio_proxy: {
        'name': 'Oratio', 'route': '/oratio/<filepath:path>'
    },

    show_radius: {
        'name': 'Radius', 'route': '/radius', 'view': 'radius', 'static': True,
    },

}
