# Copyright (c) 2026 Maen Artimy
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

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Union, Any


class MatchFields(BaseModel):
    in_port: Optional[Union[int, str]] = None
    eth_src: Optional[str] = None
    eth_dst: Optional[str] = None
    eth_type: Optional[int] = None
    ip_proto: Optional[int] = None
    ipv4_src: Optional[str] = None
    ipv4_dst: Optional[str] = None
    tcp_src: Optional[int] = None
    tcp_dst: Optional[int] = None
    udp_src: Optional[int] = None
    udp_dst: Optional[int] = None

    # Add other common match fields as needed
    class Config:
        extra = "allow"


class FlowEntry(BaseModel):
    dpid: Union[int, str]
    operation: str = "add"  # add, mod, modst, del, delst
    table_id: int = 0
    priority: int = 0
    idle_timeout: int = 0
    hard_timeout: int = 0
    cookie: int = 0
    cookie_mask: int = 0
    out_port: Optional[Union[int, str]] = -1
    out_group: Optional[int] = -1
    match: Optional[Dict[str, Any]] = None
    # FlowManager format
    meter_id: Optional[int] = None
    apply: Optional[List[Dict[str, str]]] = None
    clearactions: Optional[bool] = None
    write: Optional[Dict[str, str]] = None
    metadata: Optional[int] = None
    metadata_mask: Optional[int] = 0
    goto: Optional[int] = None
    # Legacy format
    actions: Optional[List[Union[str, Dict[str, Any]]]] = None

    # Flags
    SEND_FLOW_REM: Optional[bool] = False
    CHECK_OVERLAP: Optional[bool] = False
    RESET_COUNTS: Optional[bool] = False
    NO_PKT_COUNTS: Optional[bool] = False
    NO_BYT_COUNTS: Optional[bool] = False


class Bucket(BaseModel):
    weight: int = 0
    watch_port: Optional[int] = 0xFFFFFFFF  # OFPP_ANY
    watch_group: Optional[int] = 0xFFFFFFFF  # OFPG_ANY
    actions: List[Union[str, Dict[str, str]]]


class GroupEntry(BaseModel):
    dpid: Union[int, str]
    operation: str = "add"  # add, mod, del
    type: str  # ALL, SELECT, INDIRECT, FF
    group_id: int
    buckets: List[Bucket]


class MeterBand(BaseModel):
    type: str  # DROP, DSCP_REMARK
    rate: int
    burst_size: int
    prec_level: Optional[int] = 0


class MeterEntry(BaseModel):
    dpid: Union[int, str]
    operation: str = "add"  # add, mod, del
    meter_id: int
    # Legacy format
    flags: Optional[List[str]] = None
    # FlowManager format
    OFPMF_KBPS: Optional[bool] = False
    OFPMF_PKTPS: Optional[bool] = False
    OFPMF_BURST: Optional[bool] = False
    OFPMF_STATS: Optional[bool] = False
    bands: List[
        Union[MeterBand, List[Any]]
    ]  # Can be list of MeterBand or legacy list format [type, rate, burst, prec]


class ConfigUpload(BaseModel):
    meters: Optional[List[Dict[str, List[Dict[str, Any]]]]] = None
    groups: Optional[List[Dict[str, List[Dict[str, Any]]]]] = None
    flows: Optional[List[Dict[str, List[Dict[str, Any]]]]] = None
