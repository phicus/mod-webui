#!/usr/bin/python

# -*- coding: utf-8 -*-

import json
import random
import time
import requests
from shinken.log import logger

def kiwi_api_proxy(filepath):

    url = app.request.url
    
    path = "/".join(url.split('/')[3:0])
            
    url = "http://localhost:4280/api/{}".format(path)

    try:
        r = requests.get(url)
        if r.status_code != 200:
            logger.error("[kws-api-proxy]  not found: %d - %s", r.status_code, url)
            app.bottle.response.status = r.status_code
            app.bottle.response.content_type = 'application/json'
            return json.dumps(
                {'status': 'ko', 'message': r.content}
            )

    except Exception as e:
        logger.error("[kws-api-proxy] exception: %s", str(e))
        app.bottle.response.status = 409
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
