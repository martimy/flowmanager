# Copyright (c) 2018-2026 Maen Artimy
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
import asyncio
import logging
from typing import List, Optional
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from models import FlowEntry, GroupEntry, MeterEntry, ConfigUpload

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
    """Manages active WebSocket connections and broadcasts messages to all clients.

    Replaces the old WebSocketRPCServer / rpc_clients pattern. The single shared
    instance is stored on app.state so other modules can reach it via the FastAPI
    app object, mirroring the old self.ctrl_api.app reference.
    """

    def __init__(self):
        self.active_connections: set[WebSocket] = set()
        self._loop: asyncio.AbstractEventLoop | None = None

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        """Store the event loop so sync callers can schedule broadcasts onto it."""
        self._loop = loop

    def register(self, websocket: WebSocket):
        self.active_connections.add(websocket)

    def unregister(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: str):
        """Send a message to every connected client, pruning stale connections."""
        disconnected = set()
        for ws in self.active_connections:
            try:
                await ws.send_text(message)
            except Exception as e:
                logger.error("Error broadcasting to websocket: %s", e)
                disconnected.add(ws)
        self.active_connections -= disconnected

    def broadcast_sync(self, message: str):
        """Thread-safe broadcast for callers running outside the asyncio loop.

        flowmanager.py runs in an OS-Ken/eventlet hub thread, so it cannot
        await directly. This schedules the coroutine onto the stored loop.
        """
        if self._loop is None or not self._loop.is_running():
            logger.error("broadcast_sync called before event loop is available")
            return
        asyncio.run_coroutine_threadsafe(self.broadcast(message), self._loop)


# Single shared instance - registered on app.state in run_server()
manager = ConnectionManager()


def broadcast_sync(message: str):
    """Module-level convenience wrapper used by flowmanager.py."""
    manager.broadcast_sync(message)


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
        return JSONResponse(
            content={"error": "ctrl_api not initialized"}, status_code=500
        )

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
async def post_meter_form(entry: MeterEntry):
    """Connect with meter form"""
    return ctrl_api.process_meter_message(entry.dict(exclude_unset=True))


@app.post("/groupform")
async def post_group_form(entry: GroupEntry):
    """Connect with group form"""
    return ctrl_api.process_group_message(entry.dict(exclude_unset=True))


@app.post("/flowform")
async def post_flow_form(entry: FlowEntry):
    """Connect with flow control form"""
    return ctrl_api.process_flow_message(entry.dict(exclude_unset=True))


@app.post("/upload")
async def post_config_upload(config: ConfigUpload):
    """Connect with configuration upload form"""
    meters = config.meters
    groups = config.groups
    flows = config.flows

    response_meters = ctrl_api.process_meter_upload(meters) if meters else ""
    response_groups = ctrl_api.process_group_upload(groups) if groups else ""
    response_flows = ctrl_api.process_flow_upload(flows) if flows else ""
    return f"{response_meters}, {response_groups}, {response_flows}"


@app.post("/flowdel")
async def post_flow_delete(entries: List[FlowEntry]):
    """Receive flows delete request"""
    return ctrl_api.delete_flow_list([e.dict(exclude_unset=True) for e in entries])


@app.post("/flowmonitor")
async def post_flow_monitor(entries: List[FlowEntry]):
    """Receive flows monitor request"""
    return ctrl_api.monitor_flow_list([e.dict(exclude_unset=True) for e in entries])


@app.post("/resetmonitor")
async def post_reset_flow_monitor(data: dict):
    """Reset flows monitoring data"""
    return ctrl_api.rest_flow_monitoring(data)


@app.websocket("/ws")
async def websocket_handler(websocket: WebSocket):
    await websocket.accept()
    manager.register(websocket)
    logger.debug("WebSocket connected: %s", websocket)
    try:
        while True:
            # The JS client never sends meaningful data — this just keeps the
            # connection open and detects clean disconnects via the exception.
            await websocket.receive_text()
    except WebSocketDisconnect:
        logger.debug("WebSocket disconnected: %s", websocket)
    finally:
        manager.unregister(websocket)


# Mount static files AFTER all other routes to avoid shadowing
app.mount(
    "/home",
    StaticFiles(directory=os.path.join(os.path.dirname(__file__), "web"), html=True),
    name="web",
)


def run_server(ctrl, host, port):
    global ctrl_api
    ctrl_api = ctrl

    # Capture the event loop once uvicorn starts it, so broadcast_sync() can
    # schedule coroutines onto it from the OS-Ken hub thread.
    @app.on_event("startup")
    async def _on_startup():
        import asyncio

        manager.set_loop(asyncio.get_running_loop())
        app.state.manager = manager  # also available via app.state if needed

    import uvicorn

    uvicorn.run(app, host=host, port=port, log_level="info")
