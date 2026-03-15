# Copyright (c) 2018-2023 Maen Artimy
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
This module includes FastAPI application for FlowManager.
"""

import os
import logging
from typing import List, Optional
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger("flowmanager")

app = FastAPI(title="FlowManager API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global reference to ctrl_api
ctrl_api = None

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to websocket: {e}")

manager = ConnectionManager()

@app.get("/status")
async def get_flow_stats(status: str, dpid: str):
    """Get stats"""
    if ctrl_api:
        data = ctrl_api.get_stats(status, dpid)
        return JSONResponse(content=data)
    return JSONResponse(content={"error": "ctrl_api not initialized"}, status_code=500)

@app.get("/data")
async def get_switch_data(request: Request):
    """Get switch data"""
    if not ctrl_api:
        return JSONResponse(content={"error": "ctrl_api not initialized"}, status_code=500)
    
    params = request.query_params
    if params.get("list") == "switches":
        lst = {t[0]: t[0] for t in ctrl_api.get_switches()}
    else:
        req_type = list(params.keys())[0]
        dpid = int(params[req_type])
        lst = ctrl_api.get_stats_request(req_type, dpid)
    return JSONResponse(content=lst)

@app.get("/topology")
async def get_topology():
    """Get topology info"""
    if ctrl_api:
        return JSONResponse(content=ctrl_api.get_topology_data())
    return JSONResponse(content={"error": "ctrl_api not initialized"}, status_code=500)

@app.get("/logs")
async def get_logs():
    """Get log messages"""
    if ctrl_api:
        return JSONResponse(content=ctrl_api.read_logs())
    return JSONResponse(content={"error": "ctrl_api not initialized"}, status_code=500)

@app.post("/meterform")
async def post_meter_form(request: Request):
    """Connect with meter form"""
    data = await request.json()
    return ctrl_api.process_meter_message(data)

@app.post("/groupform")
async def post_group_form(request: Request):
    """Connect with group form"""
    data = await request.json()
    return ctrl_api.process_group_message(data)

@app.post("/flowform")
async def post_flow_form(request: Request):
    """Connect with flow control form"""
    data = await request.json()
    return ctrl_api.process_flow_message(data)

@app.post("/upload")
async def post_config_upload(request: Request):
    """Connect with configuration upload form"""
    data = await request.json()
    meters = data.get("meters")
    groups = data.get("groups")
    flows = data.get("flows")

    response_meters = ctrl_api.process_meter_upload(meters) if meters else ""
    response_groups = ctrl_api.process_group_upload(groups) if groups else ""
    response_flows = ctrl_api.process_flow_upload(flows) if flows else ""
    return f"{response_meters}, {response_groups}, {response_flows}"

@app.post("/flowdel")
async def post_flow_delete(request: Request):
    """Receive flows delete request"""
    data = await request.json()
    return ctrl_api.delete_flow_list(data)

@app.post("/flowmonitor")
async def post_flow_monitor(request: Request):
    """Receive flows monitor request"""
    data = await request.json()
    return ctrl_api.monitor_flow_list(data)

@app.post("/resetmonitor")
async def post_reset_flow_monitor(request: Request):
    """Reset flows monitoring data"""
    data = await request.json()
    return ctrl_api.rest_flow_monitoring(data)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We don't expect messages from client for now, but need to keep it open
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Mount static files AFTER all other routes to avoid shadowing
app.mount("/home", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "web"), html=True), name="web")

def run_server(ctrl, host, port):
    global ctrl_api
    ctrl_api = ctrl
    import uvicorn
    # Use standard uvicorn worker, it will run in its own loop
    # If monkey-patched, it will use greened primitives.
    uvicorn.run(app, host=host, port=port, log_level="info")
