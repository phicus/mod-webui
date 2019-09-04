#!/usr/bin/python

# -*- coding: utf-8 -*-

import os
import bottle

from shinken.log import logger

webuimod_dir = os.path.abspath(os.path.dirname(__file__))

def show_m(host):
    return {}

def show_m_hash():
    return {}

def load_html(path):

    static_folder = os.path.join(webuimod_dir, 'htdocs/html')

    logger.info("[WebUi-m] p=%s", static_folder)

    p = os.path.join(static_folder, path)
    if not os.path.exists(p):
         app.redirect404()

    return bottle.static_file(path, root=static_folder)

pages = {
    show_m: {
        'name': 'Cpe', 'route': '/m/:host', 'view': 'cpem', 'static': True,
    },

    show_m_hash: {
        'name': 'Cpe', 'route': '/m/', 'view': 'cpem', 'static': True,
    },

    load_html: {
        'name': 'Static', 'route': '/m/html/:path#.+#',
    }

}