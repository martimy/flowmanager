# Copyright (c) 2018-2019 Maen Artimy
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from ryu.app.wsgi import ControllerBase
from ryu.app.wsgi import route
from ryu.app.wsgi import Response
from ryu.app.wsgi import websocket
from ryu.app.wsgi import WebSocketRPCClient
import os
import sys
import mimetypes
import time

PYTHON3 = sys.version_info > (3, 0)


class WebApi(ControllerBase):
    def __init__(self, req, link, data, **config):
        super(WebApi, self).__init__(req, link, data, **config)
        self.api = data["webctl"]
        self.rpc_clients = data["rpc_clients"]
        self.rootdir = os.path.dirname(os.path.abspath(__file__))

    def make_response(self, filename):
        filetype, _ = mimetypes.guess_type(filename)
        if not filetype:
            filetype = 'application/octet-stream'
        res = Response(content_type=filetype)
        res.body = open(filename, 'rb').read()
        return res

    @route('monitor', '/status', methods=['GET'])
    def get_flow_stats(self, req, **_kwargs):
        """Get stats
        """
        if req.GET['status'] and req.GET['dpid']:
            res = Response(content_type="application/json")
            res.json = self.api.get_stats(req.GET['status'], req.GET['dpid'])
            return res
        return Response(status=404)  # Resource does not exist

    @route('monitor', '/data', methods=['GET'])
    def get_switch_data(self, req, **_kwargs):
        """Get switch data
        """
        if req.GET:  # is this if needed?
            lst = {}  # the server always returns somthing??
            if req.GET.get("list") == "switches":
                lst = {t[0]: t[0] for t in self.api.get_switches()}
            else:
                request = list(req.GET.keys())[0]
                dpid = int(req.GET[request])
                lst = self.api.get_stats_request(request, dpid)

            res = Response(content_type="application/json")
            res.json = lst
            return res
        return Response(status=400)  # bad request

    @route('monitor', '/topology', methods=['GET'])
    def get_topology(self, req, **_kwargs):
        """Get topology info
        """
        res = Response(content_type="application/json")
        reply = self.api.get_topology_data()
        res.json = reply
        return res

    # merge the thre form methods
    @route('monitor', '/meterform', methods=['POST'])
    def post_meter_form(self, req, **_kwargs):
        """Connect with meter form
        """
        if req.POST:
            res = Response()
            s = self.api.process_meter_message(req.json)
            res.text = s if PYTHON3 else unicode(s, "utf-8")
            return res
        return Response(status=400)  # bad request

    @route('monitor', '/groupform', methods=['POST'])
    def post_group_form(self, req, **_kwargs):
        """Connect with group form
        """
        if req.POST:
            res = Response()
            s = self.api.process_group_message(req.json)
            res.text = s if PYTHON3 else unicode(s, "utf-8")
            return res
        return Response(status=400)  # bad request

    @route('monitor', '/flowform', methods=['POST'])
    def post_flow_form(self, req, **_kwargs):
        """Connect with flow control form
        """
        if req.POST:
            res = Response()
            s = self.api.process_flow_message(req.json)
            res.text = s if PYTHON3 else unicode(s, "utf-8")
            return res
        return Response(status=400)  # bad request

    @route('monitor', '/upload', methods=['POST'])
    def post_config_upload(self, req, **_kwargs):
        """Connect with configuration upload form
        """
        if req.POST:
            meters = req.json.get('meters', None)
            groups = req.json.get('groups', None)
            flows = req.json.get('flows', None)

            rm = self.api.process_meter_upload(meters) if meters else ''
            gm = self.api.process_group_upload(groups) if groups else ''
            fm = self.api.process_flow_upload(flows) if flows else ''
            res = Response()
            s = "{}, {}, {}".format(rm, gm, fm)
            res.text = s if PYTHON3 else unicode(s, "utf-8")
            return res

        return Response(status=400)  # bad request

    # TODO: merge the next two methods
    @route('monitor', '/flowdel', methods=['POST'])
    def post_flow_delete(self, req, **_kwargs):
        """Receive flows delete request
        """
        if req.POST:
            res = Response()
            s = self.api.delete_flow_list(req.json)
            res.text = s if PYTHON3 else unicode(s, "utf-8")
            return res
        return Response(status=400)  # bad request

    @route('monitor', '/flowmonitor', methods=['POST'])
    def post_flow_monitor(self, req, **_kwargs):
        """Receive flows monitor request
        """
        if req.POST:
            res = Response()
            s = self.api.monitor_flow_list(req.json)
            res.text = s if PYTHON3 else unicode(s, "utf-8")
            return res
        return Response(status=400)  # bad request

    @route('monitor', '/logs', methods=['GET'])
    def get_logs(self, req, **_kwargs):
        """Get log mesages
        """
        if req.GET:
            logs = self.api.read_logs()
            res = Response(content_type="application/json")
            res.json = logs
            return res
        return Response(status=400)  # bad request

    @route('monitor', '/home/{filename:.*}', methods=['GET'])
    def get_filename(self, req, filename, **_kwargs):
        """Get monitoring information from ofctl_rest app
        """
        if (filename == "" or filename == None):
            filename = "index.html"
        try:
            filename = os.path.join(self.rootdir, filename)
            return self.make_response(filename)
        except IOError:
            return Response(status=400)

    @websocket('monitor', '/ws')
    def websocket_handler(self, ws):
        rpc_client = WebSocketRPCClient(ws)
        self.rpc_clients.append(rpc_client)
        rpc_client.serve_forever()

    @route('monitor', '/resetmonitor', methods=['POST'])
    def post_reset_flow_monitor(self, req, **_kwargs):
        """Reset flows monitoring data
        """
        if req.POST:
            res = Response()
            s = self.api.rest_flow_monitoring(req.json)
            res.text = s if PYTHON3 else unicode(s, "utf-8")
            return res
        return Response(status=400)  # bad request

    # @route('monitor', '/stream', methods=['GET'])
    # def get_log_SSE(self, req, **_kwargs):
    #     # Support for SSE
    #     # https://streamdata.io/blog/server-sent-events/

    #     def eventStream():
    #         print("entered")
    #         while len(self.messages) > 0:
    #             t = self.messages.pop(0) #int(time.time())
    #             body = 'retry: 10000\ndata: {}\n\n'.format(t)
    #             yield body

    #     events = ''.join([e for e in eventStream()])
    #     res = Response(content_type="text/event-stream")
    #     res.body = events #next(eventStream(),'')
    #     return res

    # messages = ["Hello,", "how", "are", "you?"]
