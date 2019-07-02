#!/usr/bin/python

# -*- coding: utf-8 -*-

import json
import random
import time
import requests
from shinken.log import logger
from libkrill.config import Config as KrillConfig

def kiwi_api_proxy(filepath):

    url = app.request.url
    path = "/".join(url.split('/')[3:])
    port = app.request.GET.pop('_api_port', 4280)
    kws_list = KrillConfig().kws_list
    default_kiwi = "http://localhost:{}/".format(port)
    realm = path.split("/")[-1][:3]
    kiwi_url = next((kws["uri"] for kws in kws_list if kws["realm"] == realm), default_kiwi)

    try:
        r = requests.get(kiwi_url, params=app.request.GET)
        if r.status_code != 200:
            logger.error("[kws-api-proxy]  not found: %d - %s", r.status_code, url)
            app.bottle.response.status = r.status_code
            app.bottle.response.content_type = 'application/json'
            return json.dumps(
                {'status': 'ko', 'message': r.content}
            )

    except Exception as e:
        logger.error("[kws-api-proxy] exception: %s", str(e))
        app.bottle.response.status = 500
        app.bottle.response.content_type = 'application/json'
        return json.dumps(
            {'status': 'ko', 'message': str(e)}
        )

    app.bottle.response.content_type = str(r.headers['content-type'])
    return r.content


pages = {
    kiwi_api_proxy: {
        'name': 'API', 'route': '/api/<filepath:path>'
    },
}
