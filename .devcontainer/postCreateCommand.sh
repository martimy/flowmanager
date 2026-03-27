#!/bin/bash
set -e

echo "Pulling FlowManager and Mininet images (only once)..."
docker compose pull

echo "FlowManager + Mininet lab is ready in GitHub Codespaces!"
echo ""
echo "Start the lab with these two commands:"
echo "   1. docker compose up -d          # starts controller + Mininet container"
echo "   2. docker compose exec -it mininet /root/topo/mn_threeswitch.topo.py"
echo ""
echo "FlowManager Web UI will automatically open in a new tab."
