#!/usr/bin/python
# -*- coding: utf-8 -*-

from datamanager import WebUIDataManager
from shinken.log import logger
import re
import itertools
import operator
import time
from shinken.misc.perfdata import PerfDatas


class KrillUIDataManager(WebUIDataManager):

    def __init__(self, rg=None, frontend=None, alignak=False):
        super(KrillUIDataManager, self).__init__(rg, frontend, alignak)

    ##
    # Krill Searching
    ##
    def search_hosts_and_services(self, search, user, get_impacts=True, sorter=None):
        # items = super(KrillUIDataManager, self).search_hosts_and_services(search, user, get_impacts, sorter)
        # return items
        def _append_based_on_filtered_by_type(new_items, i, filtered_by_type):

            def _append_host_and_its_services(new_items, i):
                    def _doit(new_items, host):
                        if host not in new_items:
                            new_items.append(host)

                            for s in host.get_services():
                                if s not in new_items:
                                    new_items.append(s)

                    if i.my_type == 'host':
                        _doit(new_items, i)
                    elif i.my_type == 'service':
                        _doit(new_items, i.host)

            if filtered_by_type:
                if i not in new_items:
                    new_items.append(i)
            else:
                _append_host_and_its_services(new_items, i)


        def _filter_item(i):
            if pat.search(i.get_full_name()) or pat.search(i.output):
                return True
            for v in i.customs.values():
                if pat.search(v):
                    return True

            try:
                h = i if i.__class__.my_type == 'host' else i.host
                if h.address and pat.search(h.address):
                    return True
                if h.cpe_address and pat.search(h.cpe_address):
                    return True
                if h.cpe_registration_host and pat.search(h.cpe_registration_host):
                    return True
                if h.cpe_registration_id and pat.search(h.cpe_registration_id):
                    return True
                if h.cpe_registration_state and pat.search(h.cpe_registration_state):
                    return True
                if h.cpe_ipleases and pat.search(h.cpe_ipleases):
                    return True
            except Exception, exc:
                logger.warning("[WebUI - datamanager] _filter_item: (%s) - %s / %s", exc, type(h.cpe_ipleases), h.cpe_ipleases)


            return False

        def get_parents_recursive(item):
            if len(item.parents) > 0:
                parents = []
                for parent in item.parents:
                    parents.append(parent)
                    parents = parents + get_parents_recursive(parent)
                return parents
            else:
                return []

        def get_childs_recursive(item):
            if len(item.childs) > 0:
                childs = []
                for child in item.childs:
                    childs.append(child)
                    childs = childs + get_childs_recursive(child)
                return childs
            else:
                return []


        # Make user an User object ... simple protection.
        if isinstance(user, basestring):
            user = self.rg.contacts.find_by_name(user)

        items = []
        if self.alignak and self.fe.initialized:
            logger.debug("[WebUI - datamanager] frontend hosts: %d items", len(self.fe.hosts))
            items.extend(
                self._only_related_to(
                    self.fe.hosts,
                    user
                )
            )
            logger.debug("[WebUI - datamanager] frontend services: %d items", len(self.fe.services))
            items.extend(
                self._only_related_to(
                    self.fe.services,
                    user
                )
            )

        else:
            items.extend(
                self._only_related_to(
                    super(WebUIDataManager, self).get_hosts(),
                    user
                )
            )
            items.extend(
                self._only_related_to(
                    super(WebUIDataManager, self).get_services(),
                    user
                )
            )

        logger.debug("[WebUI - datamanager] search_hosts_and_services, search for %s in %d items", search, len(items))

        # Search patterns like: isnot:0 isnot:ack isnot:"downtime fred" name "vm fred"
        regex = re.compile(
            r'''
                                    # 1/ Search a key:value pattern.
                (?P<key>\w+):       # Key consists of only a word followed by a colon
                (?P<quote2>["']?)   # Optional quote character.
                (?P<value>.*?)      # Value is a non greedy match
                (?P=quote2)         # Closing quote equals the first.
                ($|\s)              # Entry ends with whitespace or end of string
                |                   # OR
                                    # 2/ Search a single string quoted or not
                (?P<quote>["']?)    # Optional quote character.
                (?P<name>.*?)       # Name is a non greedy match
                (?P=quote)          # Closing quote equals the opening one.
                ($|\s)              # Entry ends with whitespace or end of string
            ''',
            re.VERBOSE
            )

        filtered_by_type = False
        patterns = []
        for match in regex.finditer(search):
            if match.group('name'):
                patterns.append( ('name', match.group('name')) )
            elif match.group('key'):
                patterns.append( (match.group('key'), match.group('value')) )
        logger.debug("[WebUI - datamanager] search patterns: %s", patterns)

        for t, s in patterns:
            t = t.lower()
            logger.debug(u"[WebUI - datamanager] searching for %s %s", t, s.decode('utf-8'))

            if t == 'name':
                # Case insensitive
                pat = re.compile(unicode(s.decode('utf-8')), re.IGNORECASE | re.UNICODE)
                new_items = []
                for i in items:
                    if _filter_item(i):
                        _append_based_on_filtered_by_type(new_items, i, filtered_by_type)
                    else:
                        for j in (i.impacts + i.source_problems):
                            if (pat.search(j.get_full_name()) or
                                (j.__class__.my_type == 'host' and
                                 j.alias and pat.search(j.alias))):
                                new_items.append(i)

                if not new_items:
                    for i in items:
                        if pat.search(i.output):
                            new_items.append(i)
                        else:
                            for j in (i.impacts + i.source_problems):
                                if pat.search(j.output):
                                    new_items.append(i)

                items = new_items

            if (t == 'h' or t == 'host') and s.lower() != 'all':
                logger.debug("[WebUI - datamanager] searching for an host %s", s)
                # Case sensitive
                pat = re.compile(s)
                new_items = []
                for i in items:
                    if i.__class__.my_type == 'host' and pat.search(i.get_name()):
                        new_items.append(i)
                    if i.__class__.my_type == 'service' and pat.search(i.host_name):
                        new_items.append(i)

                items = new_items
                logger.debug("[WebUI - datamanager] host:%s, %d matching items", s, len(items))
                # for item in items:
                #     logger.info("[WebUI - datamanager] item %s is %s", item.get_name(), item.__class__)

            if (t == 's' or t == 'service') and s.lower() != 'all':
                logger.debug("[WebUI - datamanager] searching for a service %s", s)
                pat = re.compile(s)
                new_items = []
                for i in items:
                    if i.__class__.my_type == 'service' and pat.search(i.get_name()):
                        new_items.append(i)

                items = new_items
                logger.debug("[WebUI - datamanager] service:%s, %d matching items", s, len(items))
                # for item in items:
                #     logger.info("[WebUI - datamanager] item %s is %s", item.get_name(), item.__class__)

            if (t == 'c' or t == 'contact') and s.lower() != 'all':
                logger.debug("[WebUI - datamanager] searching for a contact %s", s)
                pat = re.compile(s)
                new_items = []
                for i in items:
                    if i.__class__.my_type == 'contact' and pat.search(i.get_name()):
                        new_items.append(i)

                items = new_items

            if (t == 'hg' or t == 'hgroup') and s.lower() != 'all':
                logger.debug("[WebUI - datamanager] searching for items in the hostgroup %s", s)
                new_items = []
                for x in s.split('|'):
                    group = self.get_hostgroup(x)
                    if not group:
                        return []
                    # Items have a item.get_groupnames() method that returns a comma separated string ... strange format!
                    for item in items:
                        #if group.get_name() in item.get_groupnames().split(', '):
                            # logger.info("[WebUI - datamanager] => item %s is a known member!", item.get_name())

                        if group.get_name() in item.get_groupnames().split(', '):
                            new_items.append(item)
                items = new_items

            if (t == 'sg' or t == 'sgroup') and s.lower() != 'all':
                logger.debug("[WebUI - datamanager] searching for items in the servicegroup %s", s)
                group = self.get_servicegroup(s)
                if not group:
                    return []
                # Items have a item.get_groupnames() method that returns a comma+space separated string ... strange format!
                # for item in items:
                #     if group.get_name() in item.get_groupnames().split(','):
                #         logger.debug("[WebUI - datamanager] => item %s is a known member!", item.get_name())
                items = [i for i in items if group.get_name() in i.get_groupnames().split(',')]

            #@mohierf: to be refactored!
            if (t == 'cg' or t == 'cgroup') and s.lower() != 'all':
                # logger.info("[WebUI - datamanager] searching for items related with the contactgroup %s", s)
                group = self.get_contactgroup(s, user)
                if not group:
                    return []
                # Items have a item.get_groupnames() method that returns a comma+space separated string ... strange format!
                #for item in items:
                #    for contact in item.contacts:
                #        if group.get_name() in contact.get_groupnames().split(', '):
                #            logger.info("[WebUI - datamanager] => contact %s is a known member!", contact.get_name())

                contacts = [c for c in self.get_contacts(user=user) if c in group.members]
                items = list(set(itertools.chain(*[self._only_related_to(items, self.rg.contacts.find_by_name(c)) for c in contacts])))

            if t == 'realm':
                r = self.get_realm(s)
                if not r:
                    return []  # :TODO:maethor:150716: raise an error
                items = [i for i in items if i.get_realm() == r]

            if t == 'htag' and s.lower() != 'all':
                items = [i for i in items if s in i.get_host_tags()]

            if t == 'stag' and s.lower() != 'all':
                items = [i for i in items if i.__class__.my_type == 'service' and s in i.get_service_tags()]

            if t == 'ctag' and s.lower() != 'all':
                contacts = [c for c in self.get_contacts(user=user) if s in c.tags]
                items = list(set(itertools.chain(*[self._only_related_to(items, c) for c in contacts])))

            if t == 'type' and s.lower() != 'all':
                filtered_by_type = True
                items = [i for i in items if i.__class__.my_type == s]
                # logger.info("[WebUI - datamanager] type:%s, %d matching items", s, len(items))
                # for item in items:
                #     logger.info("[WebUI - datamanager] item %s is %s", item.get_name(), item.__class__)

            if t == 'bp' or t == 'bi':
                if s.startswith('>='):
                    items = [i for i in items if i.business_impact >= int(s[2:])]
                elif s.startswith('<='):
                    items = [i for i in items if i.business_impact <= int(s[2:])]
                elif s.startswith('>'):
                    items = [i for i in items if i.business_impact > int(s[1:])]
                elif s.startswith('<'):
                    items = [i for i in items if i.business_impact < int(s[1:])]
                else:
                    if s.startswith('='):
                        s = s[1:]
                    items = [i for i in items if i.business_impact == int(s)]

            if t == 'duration':
                seconds_per_unit = {"s": 1, "m": 60, "h": 3600, "d": 86400, "w": 604800}
                times = [(i, time.time() - int(i.last_state_change)) for i in items]
                try:
                    if s.startswith('>='):
                        s = int(s[2:-1]) * seconds_per_unit[s[-1].lower()]
                        items = [i[0] for i in times if i[1] >= s]
                    elif s.startswith('<='):
                        s = int(s[2:-1]) * seconds_per_unit[s[-1].lower()]
                        items = [i[0] for i in times if i[1] <= s]
                    elif s.startswith('>'):
                        s = int(s[1:-1]) * seconds_per_unit[s[-1].lower()]
                        items = [i[0] for i in times if i[1] > s]
                    elif s.startswith('<'):
                        s = int(s[1:-1]) * seconds_per_unit[s[-1].lower()]
                        items = [i[0] for i in times if i[1] < s]
                    else:
                        items = []
                except Exception:
                    items = []

            if t == 'is':
                if s.lower() == 'ack':
                    items = [i for i in items if i.__class__.my_type == 'service' or i.problem_has_been_acknowledged]
                    items = [i for i in items if i.__class__.my_type == 'host' or (i.problem_has_been_acknowledged or i.host.problem_has_been_acknowledged)]
                elif s.lower() == 'downtime':
                    items = [i for i in items if i.__class__.my_type == 'service' or i.in_scheduled_downtime]
                    items = [i for i in items if i.__class__.my_type == 'host' or (i.in_scheduled_downtime or i.host.in_scheduled_downtime)]
                elif s.lower() == 'impact':
                    items = [i for i in items if i.is_impact]
                elif s.lower() == 'probe':
                    items = [i for i in items if i.customs.get('_PROBE', '0') == '1']
                else:
                    # Manage SOFT & HARD state
                    if s.startswith('s'):
                        s = s[1:]
                        if len(s) == 1:
                            items = [i for i in items if i.state_id == int(s) and i.state_type != 'HARD']
                        else:
                            items = [i for i in items if i.state == s.upper() and i.state_type != 'HARD']
                    elif s.startswith('h'):
                        s = s[1:]
                        if len(s) == 1:
                            items = [i for i in items if i.state_id != int(s) and i.state_type == 'HARD']
                        else:
                            items = [i for i in items if i.state != s.upper() and i.state_type == 'HARD']
                    else:
                        if len(s) == 1:
                            items = [i for i in items if i.state_id == int(s)]
                        else:
                            items = [i for i in items if i.state == s.upper()]

            if t == 'isnot':
                if s.lower() == 'ack':
                    items = [i for i in items if i.__class__.my_type == 'service' or not i.problem_has_been_acknowledged]
                    items = [i for i in items if i.__class__.my_type == 'host' or (not i.problem_has_been_acknowledged and not i.host.problem_has_been_acknowledged)]
                elif s.lower() == 'downtime':
                    items = [i for i in items if i.__class__.my_type == 'service' or not i.in_scheduled_downtime]
                    items = [i for i in items if i.__class__.my_type == 'host' or (not i.in_scheduled_downtime and not i.host.in_scheduled_downtime)]
                elif s.lower() == 'impact':
                    items = [i for i in items if not i.is_impact]
                else:
                    # Manage soft & hard state
                    if s.startswith('s'):
                        s = s[1:]
                        if len(s) == 1:
                            items = [i for i in items if i.state_id != int(s) and i.state_type != 'HARD']
                        else:
                            items = [i for i in items if i.state != s.upper() and i.state_type != 'HARD']
                    elif s.startswith('h'):
                        s = s[1:]
                        if len(s) == 1:
                            items = [i for i in items if i.state_id != int(s) and i.state_type == 'HARD']
                        else:
                            items = [i for i in items if i.state != s.upper() and i.state_type == 'HARD']
                    else:
                        if len(s) == 1:
                            items = [i for i in items if i.state_id != int(s)]
                        else:
                            items = [i for i in items if i.state != s.upper()]

            if t == 'tech':
                items = [i for i in items if i.customs.get('_TECH') == s]

            if t == 'perf':
                match = re.compile('(?P<attr>[\w_]+)(?P<operator>>=|>|==|<|<=)(?P<value>[-\d\.]+)').match(s)
                operator_str2function = {'>=':operator.ge, '>':operator.gt, '=':operator.eq, '==':operator.eq, '<':operator.lt, '<=':operator.le}
                oper = operator_str2function[match.group('operator')]
                new_items = []
                if match:
                    oper = operator_str2function[match.group('operator')]
                    for i in items:
                        if i.process_perf_data:
                            perf_datas = PerfDatas(i.perf_data)
                            matched_perfdatas = [p for p in perf_datas if match.group('attr') in p.name]
                            for perfdata in matched_perfdatas:
                                if oper(float(perf_datas[perfdata.name].value), float(match.group('value'))):
                                    _append_based_on_filtered_by_type(new_items, i, filtered_by_type)
                items = new_items

            if t == 'reg':
                new_items = []
                # logger.info("[WebUI-REG] s=%s -> len(items)=%d", s.split(','), len(items))
                # pat = re.compile(s, re.IGNORECASE)
                for i in items:
                    l1 = s.split('|')
                    if i.__class__.my_type == 'service':
                        l2 = i.host.cpe_registration_tags.split(',')
                    elif i.__class__.my_type == 'host':
                        l2 = i.cpe_registration_tags.split(',')
                    else:
                        l2 = []

                    # logger.info("[WebUI-REG] item %s -> regtags: %s", i, l2)
                    found = [x for x in l1 if x in l2]
                    if found:
                        # logger.info("[WebUI-REG] found %s", i)
                        _append_based_on_filtered_by_type(new_items, i, filtered_by_type)

                # logger.info("[WebUI-REG] s=%s -> len(new_items)=%d", s.split(','), len(new_items))
                items = new_items

            if t == 'regstate':
                new_items = []
                for i in items:
                    l1 = s.split('|')
                    if i.__class__.my_type == 'service':
                        l2 = i.host.cpe_registration_state
                    elif i.__class__.my_type == 'host':
                        l2 = i.cpe_registration_state
                    else:
                        l2 = ''
                    if s in l2:
                        _append_based_on_filtered_by_type(new_items, i, filtered_by_type)
                items = new_items

            if t == 'loc':
                pat = re.compile(s, re.IGNORECASE)
                new_items = []
                for i in items:
                    logger.info("[WebUI-LOC] i={} c={}".format(i, i.customs))

                    if pat.match(i.customs.get('_LOCATION', '')):
                        new_items.append(i)
                items = new_items

            # @author: phicus
            if t == 'vendor':
                pat = re.compile(s, re.IGNORECASE)
                new_items = []
                for i in items:
                    if pat.match(i.customs.get('_VENDOR', '')):
                        new_items.append(i)
                items = new_items

            # @author: phicus
            if t == 'model':
                pat = re.compile(s, re.IGNORECASE)
                new_items = []
                for i in items:
                    if pat.match(i.customs.get('_MODEL', '')):
                        new_items.append(i)
                    if pat.match(i.customs.get('_CPE_MODEL', '')):
                        new_items.append(i)
                items = new_items


            if t == 'city':
                pat = re.compile(s, re.IGNORECASE)
                new_items = []
                for i in items:
                    if pat.match(i.customs.get('_CUSTOMER_CITY', '')):
                        new_items.append(i)
                items = new_items

            if t == 'isaccess':
                if s.lower() in ('yes','1'):
                    items = [i for i in items if i.__class__.my_type == 'host' and i.customs.get('_ACCESS', '') == '1']
                elif s.lower() in ('no','0'):
                    items = [i for i in items if i.__class__.my_type == 'host' and i.customs.get('_ACCESS', '') == '0']

            if t == 'his':
                new_items = []
                # logger.info("[WebUI-HIS] his s=%s -> len(items)=%d", s, len(items))
                for i in items:
                    if i.__class__.my_type == 'service':
                        found = len(s) == 1 and i.host.state_id == int(s) or i.host.state == s.upper()
                        if found:
                            _append_based_on_filtered_by_type(new_items, i, filtered_by_type)

                    elif i.__class__.my_type == 'host':
                        found = len(s) == 1 and i.state_id == int(s) or i.state == s.upper()
                        if found:
                            _append_based_on_filtered_by_type(new_items, i, filtered_by_type)

                # logger.info("[WebUI-HIS] s=%s -> len(new_items)=%d", s, len(new_items))
                items = new_items

            # :COMMENT:maethor:150616: Legacy filters, kept for bookmarks compatibility
            if t == 'ack':
                if s.lower() == 'false' or s.lower() == 'no':
                    patterns.append( ("isnot", "ack") )
                if s.lower() == 'true' or s.lower() == 'yes':
                    patterns.append( ("is", "ack") )
            if t == 'downtime':
                if s.lower() == 'false' or s.lower() == 'no':
                    patterns.append( ("isnot", "downtime") )
                if s.lower() == 'true' or s.lower() == 'yes':
                    patterns.append( ("is", "downtime") )
            if t == 'crit':
                patterns.append( ("is", "critical") )

            if t == 'mode':
                new_items = []
                only_hosts = [i for i in items if i.__class__.my_type == 'host']
                if s.lower() in ('descendents', 'descendants'):
                    for item in only_hosts:
                        new_items = list(set(new_items + [item] + get_childs_recursive(item)))

                if s.lower() in ('ascendents', 'ascendants'):
                    for item in only_hosts:
                        new_items = list(set(new_items + [item] + get_parents_recursive(item)))

                if s.lower() in ('family', 'all'):
                    for item in only_hosts:
                        new_items = list(set(new_items + [item] +  get_parents_recursive(item) + get_childs_recursive(item)))

                if new_items:
                    items = new_items

        if sorter is not None:
            items.sort(sorter)

        logger.debug("[WebUI - datamanager] search_hosts_and_services, found %d matching items", len(items))

        logger.debug("[WebUI - datamanager] ----------------------------------------")
        # for item in items:
        #     logger.debug("[WebUI - datamanager] item %s is %s", item.get_name(), item.__class__)
        logger.debug("[WebUI - datamanager] ----------------------------------------")

        return items