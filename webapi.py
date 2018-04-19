# Copyright (C) 2018 Maen Artimy

import json
import os
import mimetypes
import requests
import datetime as dt
import sys

# from ryu.base import app_manager
from ryu.app.wsgi import ControllerBase
# from ryu.app.wsgi import WSGIApplication
from ryu.app.wsgi import route
from ryu.app.wsgi import Response

# sys.path.append('/home/maen/ofworkspace/simpleswitch2/ss2')

# ref: https://tools.itef.org/doc/python-routes/html


class WebApi(ControllerBase):
    def __init__(self, req, link, data, **config):
        super(WebApi, self).__init__(req, link, data, **config)
        self.api = data["webctl"]
        self.lists = data["lists"]
        self.rootdir = os.path.dirname(os.path.abspath(__file__))

    def make_response(self, filename):
        filetype, encoding = mimetypes.guess_type(filename)
        if not filetype:
            filetype = 'application/octet-stream'
        res = Response(content_type=filetype)
        res.body = open(filename, 'rb').read()
        return res

    @route('monitor', '/status', methods=['GET'])
    def get_status(self, req, **_kwargs):
        if req.GET['status'] and req.GET['dpid']:
            res = Response(content_type="application/json")
            reply = self.api.get_flow_stats(req, req.GET['dpid'])
            res.json = reply
            return res
        return Response(status=404)

    @route('monitor', '/flowform', methods=['GET', 'POST'])
    def get_flow_form(self, req, **_kwargs):
        if req.POST:
            res = Response()
            res.body = self.api.process_flow_message(req.json)
            return res
        elif req.GET and "list" in req.GET:
            lst = {}
            if req.GET["list"] == "actions":
                lst = self.lists["actions"]
            elif req.GET["list"] == "matches":
                lst = self.lists["matches"]
            elif req.GET["list"] == "switches":
                lst = {t[0]:str(t[0]) for t in self.api.get_switches()}
                print(lst)

            res = Response(content_type="application/json")
            res.json = lst
            return res
        return Response(status=400)  # bad request

    @route('monitor', '/logs', methods=['GET'])
    def get_logs(self, req, **_kwargs):
        if req.GET:
            logs = self.api.read_logs()
            res = Response(content_type="application/json")
            res.json = logs
            return res
        return Response(status=400)  # bad request

    @route('monitor', '/home/{filename:.*}', methods=['GET'])
    def get_filename(self, req, filename, **_kwargs):
        if (filename == "" or filename == None):
            filename = "index.html"
        try:
            filename = os.path.join(self.rootdir, filename)
            return self.make_response(filename)
        except IOError:
            return Response(status=400)

    # def get_log_SSE(self, req, **_kwargs):
    #     # Support for SSE
    #     # https://streamdata.io/blog/server-sent-events/

    #     def eventStream():
    #         while True:
    #             msgs = self.api.get_messages()
    #             body = ['data: {}'.format(l) for l in msgs]

    #             self.api.clear_messages()
    #             yield '\n'.join(body) + '\n\n'

    #     res = Response(content_type="text/event-stream")
    #     res.body = eventStream().next()
    #     return res