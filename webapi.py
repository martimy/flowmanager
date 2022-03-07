# Copyright (c) 2018-2022 Maen Artimy
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

"""
This module includes class WebApi, which is part of the FlowManager application.
"""

import os
import sys
import logging
import mimetypes
from ryu.app.wsgi import ControllerBase
from ryu.app.wsgi import Response
from ryu.app.wsgi import WebSocketRPCServer
from ryu.app.wsgi import route
from ryu.app.wsgi import websocket


PYTHON3 = sys.version_info > (3, 0)
logger = logging.getLogger("flowmanager")


class WebApi(ControllerBase):
    """This class offers an web-facing API for FlowManager
    """

    def __init__(self, req, link, data, **config):
        """Class Constructor
        """
        super(WebApi, self).__init__(req, link, data, **config)
        self.ctrl_api = data["webctl"]
        # self.rpc_clients = data["rpc_clients"]
        self.rootdir = os.path.dirname(os.path.abspath(__file__))
        # logger.debug("Created WebApi")

    def get_unicode(self, any_string):
        """Ensure all strings are unicode
        """
        return any_string if PYTHON3 else any_string.decode("utf-8")

    def make_response(self, filename):
        """Response with file content
        """
        filetype, _ = mimetypes.guess_type(filename)
        if not filetype:
            filetype = 'application/octet-stream'
        logger.debug("Making response from %s as %s", filename, filetype)
        res = Response(content_type=filetype)
        res.body = open(filename, 'rb').read()
        return res

    def form_response(self, process_response):
        """Provides common form repsonse
        """
        res = Response()
        res.text = self.get_unicode(process_response)
        return res

    @route('monitor', '/home/{filename:.*}', methods=['GET'])
    def get_filename(self, _, filename):
        """Load statis files
        """
        logger.debug("Requesting file %s", filename)
        if (filename == "" or filename is None):
            filename = "index.html"
        try:
            filename = os.path.join(self.rootdir, "web", filename)
            return self.make_response(filename)
        except IOError as err:
            logger.error("IOError %s", err)
            return Response(status=400)

    @route('monitor', '/status', methods=['GET'])
    def get_flow_stats(self, req):
        """Get stats
        """
        if 'status' in req.GET and 'dpid' in req.GET:
            res = Response(content_type="application/json")
            res.json = self.ctrl_api.get_stats(
                req.GET['status'], req.GET['dpid'])
            return res
        return Response(status=404)  # Resource does not exist

    @route('monitor', '/data', methods=['GET'])
    def get_switch_data(self, req):
        """Get switch data
        """
        logger.debug("Requesting data")
        lst = {}  # the server always returns somthing??
        if req.GET.get("list") == "switches":
            lst = {t[0]: t[0] for t in self.ctrl_api.get_switches()}
        else:
            request = list(req.GET.keys())[0]
            dpid = int(req.GET[request])
            lst = self.ctrl_api.get_stats_request(request, dpid)

        res = Response(content_type="application/json")
        res.json = lst
        return res

    @route('monitor', '/topology', methods=['GET'])
    def get_topology(self, _):
        """Get topology info
        """
        logger.debug("Requesting topology")
        res = Response(content_type="application/json")
        res.json = self.ctrl_api.get_topology_data()
        return res

    @route('monitor', '/logs', methods=['GET'])
    def get_logs(self, _):
        """Get log mesages
        """
        logger.debug("Requesting logs")
        res = Response(content_type="application/json")
        res.json = self.ctrl_api.read_logs()
        return res

    @route('monitor', '/meterform', methods=['POST'])
    def post_meter_form(self, req):
        """Connect with meter form
        """
        return self.form_response(self.ctrl_api.process_meter_message(req.json))

    @route('monitor', '/groupform', methods=['POST'])
    def post_group_form(self, req):
        """Connect with group form
        """
        return self.form_response(self.ctrl_api.process_group_message(req.json))

    @route('monitor', '/flowform', methods=['POST'])
    def post_flow_form(self, req):
        """Connect with flow control form
        """
        return self.form_response(self.ctrl_api.process_flow_message(req.json))

    @route('monitor', '/upload', methods=['POST'])
    def post_config_upload(self, req):
        """Connect with configuration upload form
        """
        meters = req.json.get('meters', None)
        groups = req.json.get('groups', None)
        flows = req.json.get('flows', None)

        response_meters = self.ctrl_api.process_meter_upload(
            meters) if meters else ''
        response_groups = self.ctrl_api.process_group_upload(
            groups) if groups else ''
        response_flows = self.ctrl_api.process_flow_upload(
            flows) if flows else ''
        response_all = "{}, {}, {}".format(
            response_meters, response_groups, response_flows)
        res = Response()
        res.text = self.get_unicode(response_all)
        return res

    @route('monitor', '/flowdel', methods=['POST'])
    def post_flow_delete(self, req):
        """Receive flows delete request
        """
        res = Response()
        res.text = self.get_unicode(
            self.ctrl_api.delete_flow_list(req.json))
        return res

    @route('monitor', '/flowmonitor', methods=['POST'])
    def post_flow_monitor(self, req):
        """Receive flows monitor request
        """
        res = Response()
        res.text = "This feature is disabled."
        res.text = self.get_unicode(
            self.ctrl_api.monitor_flow_list(req.json))
        return res

    @route('monitor', '/resetmonitor', methods=['POST'])
    def post_reset_flow_monitor(self, req):
        """Reset flows monitoring data
        """
        res = Response()
        res.text = self.get_unicode(
            self.ctrl_api.rest_flow_monitoring(req.json))
        return res

    @websocket('monitor', '/ws')
    def websocket_handler_2(self, ws):
        logger.debug('WebSocket connected: %s', ws)
        rpc_server = WebSocketRPCServer(ws, self.ctrl_api.app)
        rpc_server.serve_forever()
        logger.debug('WebSocket disconnected: %s', ws)
