# Copyright (C) 2018 Maen Artimy

import json
import os
import mimetypes
import requests
from ryu.base import app_manager
from ryu.app.wsgi import ControllerBase
from ryu.app.wsgi import WSGIApplication
from ryu.app.wsgi import route
from ryu.app.wsgi import Response
from ryu.controller import dpset

import six
import sys
sys.path.append('/home/maen/ofworkspace/simpleswitch2/ss2')
from app import SS2App

webapi = "webapi"

#ref: https://tools.itef.org/doc/python-routes/html

class WebController(ControllerBase):
    def __init__(self, req, link, data, **config):
        super(WebController, self).__init__(req, link, data, **config)
        self.api = data[webapi]
        self.rootdir = os.path.dirname(os.path.abspath(__file__))

    def make_response(self, filename):
        filetype, encoding = mimetypes.guess_type(filename)
        if not filetype:
            filetype = 'application/octet-stream'
        res = Response(content_type=filetype)
        res.body = open(filename, 'rb').read()
        return res

    @route('monitor', '/setup', methods=['GET'])
    def get_setup(self, req, **_kwargs):
        print(req.body)
        if req.GET and "list" in req.GET:
            lst = ""
            if req.GET["list"] == "actions":
                lst = self.api.get_data("actions")
            elif req.GET["list"] == "matches":
                lst = self.api.get_data("matches")

            res = Response()
            res.body = lst
            return res
        return Response(status=404)

    @route('monitor', '/longform', methods=['POST'])
    def get_form(self, req, **_kwargs):
        if req.POST:
            res = Response()
            data = json.loads(req.body) #, object_hook=self.ascii_encode_dict)
            res.body = self.api.send_message(data)
            return res
        else:
            res = Response()
            res.body = json.dumps(req.json["match"]) + " -- " + ','.join([str(k) for k, v in self.api.get_switches()])
            return res
        return Response(status=400)

    @route('monitor', '/home/{filename:.*}', methods=['GET'])
    def get_filename(self, req, filename, **_kwargs):
        if (filename == "" or filename == None):
            filename = "index.html"
        try:
            filename = os.path.join(self.rootdir, filename)
            return self.make_response(filename)
        except IOError:
            return Response(status=400)

class WebRestApi(app_manager.RyuApp): #, SS2App):
    #OFP_VERSIONS = [ofproto_v1_3.OFP_VERSION]

    _CONTEXTS = {'wsgi': WSGIApplication,
                 'dpset': dpset.DPSet}

    def __init__(self, *args, **kwargs):
        super(WebRestApi, self).__init__(*args, **kwargs)
        wsgi = kwargs['wsgi']
        self.dpset = kwargs['dpset']
        wsgi.register(WebController, {webapi: self})
        self.lists = {}
        self.lists['actions'] = self.read_files('actions', '/home/maen/monitor/other/actions.txt')
        self.lists['matches'] = self.read_files('matches', '/home/maen/monitor/other/matches.txt')

    def get_switches(self):
        print("Switches: ", self.dpset.get_all())
        return self.dpset.get_all()

    def read_files(self, key, filename):
        """Reads text files that contain data about match fields and actions.
        The files are tab-seperated.
        """

        items = []
        with open(filename, 'r') as my_file:
            while True:
                line = my_file.readline()
                if not line:
                    break
                lst = line.split('\t')
                items.append(lst)
        return items

    def get_data(self, key):
        """Rerieves data lists ast a string.
        """
        my_list = ''
        for lst in self.lists[key]:
            my_list += '|'.join([x.strip() for x in lst]) + '|'
        return my_list

    def send_message_rest(self, msg):
        r = requests.post("http://localhost/stats/flowentry/add", json=msg)
        print(r.status_code)

    port_id = {
        "ALL": 0xfffffffc,
        "Controller": 0xfffffffd,
        "Table": 0xfffffffe,
        "Ingress Port": 0xfffffff9,
        "Local": 0xfffffff8,
        "Normal": 0xfffffffa,
        "Flood": 0xfffffffb,
        "ANY": 0xffffffff
    }

    def get_actions(self, parser, set):
        actions = []
        aDict = {
        'SET_FIELD': (parser.OFPActionSetField,'field'),
        'COPY_TTL_OUT': (parser.OFPActionCopyTtlOut,None),
        'COPY_TTL_IN': (parser.OFPActionCopyTtlIn,None),
        'POP_PBB': (parser.OFPActionPopPbb,None),
        'PUSH_PBB': (parser.OFPActionPushPbb,'ethertype'),
        'POP_MPLS': (parser.OFPActionPopMpls,'ethertype'),
        'PUSH_MPLS': (parser.OFPActionPushMpls,'ethertype'),
        'POP_VLAN': (parser.OFPActionPopVlan,None),
        'PUSH_VLAN': (parser.OFPActionPushVlan,'ethertype'),
        'DEC_MPLS_TTL': (parser.OFPActionDecMplsTtl,None),
        'SET_MPLS_TTL': (parser.OFPActionSetMplsTtl,'mpls_ttl'),
        'DEC_NW_TTL': (parser.OFPActionDecNwTtl,None),
        'SET_NW_TTL': (parser.OFPActionSetNwTtl,'nw_ttl'),
        'SET_QUEUE': (parser.OFPActionSetQueue,'queue_id'),
        'GROUP': (parser.OFPActionGroup,'group_id'),
        'OUTPUT': (parser.OFPActionOutput,'port'),
        }

        for key in set:
            if key in aDict :
                f = aDict[key][0]       # the action
                if aDict[key][1]:       # check if the action has a value
                    kwargs = {}
                    if aDict[key][1] == 'field':
                        #x = set[key].split('=')
                        # x has same values as OFPMatch
                        #field = {'field':x[0], 'value':x[1]}
                        #print(aDict[key][1])

                        kwargs = {aDict[key][1]: set[key]}
                        print(kwargs)
                        raise Exception("Action {} not supported!".format(key))
                    #elif aDict[key][1] == 'port':
                    #    print(set[key], self.port_id[set[key]])
                    #    val = self.port_id.get(set[key], int(set[key]))
                    #    print(val)
                    #    kwargs = {aDict[key][1]: val}
                    else:
                        kwargs = {aDict[key][1]: int(set[key])}
                    actions.append(f(**kwargs))
                else:
                    actions.append(f())
            else:
                raise Exception("Action {} not supported!".format(key))
        return actions

    def send_message(self, d):
        dp = self.dpset.get(d["dpid"])
        ofproto = dp.ofproto
        parser = dp.ofproto_parser
        inst = []

        mod_kwargs = {
            'datapath': dp,
            'command': ofproto.OFPFC_ADD,
            'buffer_id': 0xffffffff,
        }

        msg_kwargs = {
            'datapath': dp,
            'command': ofproto.OFPFC_ADD,
        }

        try:
            msg_kwargs['table_id'] = d['table_id']

            # Match fields
            mf = d["match"]
            match = parser.OFPMatch(**mf)
            #print(match.to_jsondict())

            msg_kwargs['match'] = match
            msg_kwargs['hard_timeout'] = d['hard_timeout'] #if d['hard_timeout'] else 0
            msg_kwargs['idle_timeout'] = d['idle_timeout'] #if d['idle_timeout'] else 0
            msg_kwargs['priority'] = d['priority'] #if d['priority'] else 0
            msg_kwargs['cookie'] = d['cookie'] #if d['cookie'] else 0
            msg_kwargs['cookie_mask'] = d['cookie_mask'] #if d['cookie_mask'] else 0

            # instructions
            # Goto meter
            if d["meter_id"]:
                inst += [parser.OFPInstructionMeter(d["meter_id"])]
            # Apply Actions
            if d["apply"]:
                applyActions = self.get_actions(parser, d["apply"])
                inst += [parser.OFPInstructionActions(ofproto.OFPIT_APPLY_ACTIONS, applyActions)]
            # Clear Actions
            if d["clearactions"]:
                inst += [parser.OFPInstructionActions(ofproto.OFPIT_CLEAR_ACTIONS, [])]
            # Write Actions
            if d["write"]:
                writeActions = self.get_actions(parser, d["write"])
                inst += [parser.OFPInstructionActions(ofproto.OFPIT_WRITE_ACTIONS, writeActions)]
            # Write Metadata
            if d["metadata"]:
                inst += [parser.OFPInstructionWriteMetadata(d["metadata"], d["metadata_mask"])]
            # Goto Table Metadata
            if d["goto"]:
                inst += [parser.OFPInstructionGotoTable(table_id=d["goto"])]

            if inst:
                msg_kwargs['instructions'] = inst

            # Flags
            flags = 0
            flags += 0x01 if d['SEND_FLOW_REM'] else 0
            flags += 0x02 if d['CHECK_OVERLAP'] else 0
            flags += 0x04 if d['RESET_COUNTS'] else 0
            flags += 0x08 if d['NO_PKT_COUNTS'] else 0
            flags += 0x10 if d['NO_BYT_COUNTS'] else 0

            msg_kwargs['flags'] = flags

        except Exception as e:
            return e.__repr__()
        msg = dp.ofproto_parser.OFPFlowMod(**msg_kwargs)
        dp.send_msg(msg)

        return "So far so good."
