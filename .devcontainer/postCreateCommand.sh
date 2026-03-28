#!/bin/bash
set -e

echo "🔄 Installing Mininet natively (only once)..."
sudo apt-get update -qq && sudo apt-get install -y mininet openvswitch-switch && sudo service openvswitch-switch start

echo "🔄 Pulling FlowManager image..."
docker pull martimy/flowmanager:latest

echo "✅ FlowManager + Mininet are ready!"
echo ""
echo "Start the lab:"
echo "1. Start controller + FlowManager"
echo "   docker run -d -p 6653:6653 -p 8080:8080 \"
echo "          -v ${PWD}/examples:/home/auser/app --name flowmanager \"
echo "          martimy/flowmanager app/learning_switch_2.py"
echo "2. Start topology (Mininet)"
echo "   ./examples/mn_threeswitch_topo.py"
echo ""
