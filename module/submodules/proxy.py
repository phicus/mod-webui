#!/usr/bin/env python
# -*- coding: utf-8 -*-
# vim: ai ts=4 sts=4 et sw=4 nu

from shinken.log import logger

from .metamodule import MetaModule


class ProxyMetaModule(MetaModule):

    # Only those functions are enough for an helpdesk module ...
    _functions = ['get_proxy_url']
    _custom_log = ""

    def __init__(self, modules, app):
        ''' Because it wouldn't make sense to use many submodules in this
            MetaModule, we only use the first one in the list of modules.
        '''
        self.app = app
        self.module = None
        if modules:
            if len(modules) > 1:
                logger.warning('[WebUI] Too much proxy modules declared (%s > 1). Using %s.' % (len(modules), modules[0]))
            self.module = modules[0]

    def is_available(self):
        return self.module is not None


    def get_proxy_url(self):
        return self.module.get_proxy_url()
