#!/bin/bash
set -e

echo "🔄 Installing Mininet natively (only once)..."
apt-get update -qq
apt-get install -y git net-tools curl
git clone https://github.com/mininet/mininet.git ~/mininet
cd ~/mininet
util/install.sh -a   # installs Mininet + OVS natively
cd ~

echo "🔄 Pulling FlowManager image..."
docker pull martimy/flowmanager:latest

echo "✅ FlowManager + Mininet are ready!"
echo ""
echo "Start the lab:"
echo "1. Start controller + FlowManager"
echo "   docker run -d -p 6653:6653 -p 8080:8080 /"
echo "          -v ${PWD}/examples:/home/auser/app --name flowmanager /"
echo "          martimy/flowmanager app/learning_switch_2.py"
echo "2. Start topology (Mininet)"
echo "   ./examples/mn_threeswitch_topo.py"
echo ""
