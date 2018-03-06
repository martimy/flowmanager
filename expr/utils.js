/*
 * Copyright (C) 2014 SDN Hub
 *
 * Licensed under the GNU GENERAL PUBLIC LICENSE, Version 3.
 * You may not use this file except in compliance with this License.
 * You may obtain a copy of the License at
 *
 *    http://www.gnu.org/licenses/gpl-3.0.txt
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
 * implied.
 */

var ethertypeToString = function(type) {
    switch (type) {
        case 0x800: return "IPv4";
        case 0x806: return "LLDP";
        case 0x88cc: return "LLDP";
        case 0x86dd: return "IPv6";
        default: return "Unknown";
    }
}

var nwprotoToString = function(type) {
    switch (type) {
        case 0x1: return "IPv4";
        case 0x6: return "TCP";
        case 0x11: return "UDP";
        case 0x84: return "SCTP";
        default: return "Unknown";
    }
}

var removeAllChildren = function(node) {
    while (node.firstChild) {
            node.removeChild(node.firstChild);
    }
}

