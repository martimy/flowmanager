import requests
import json
import time

BASE_URL = "http://localhost:8080"

def test_get_index():
    print("Testing GET /home/index.html...")
    r = requests.get(f"{BASE_URL}/home/index.html")
    assert r.status_code == 200
    assert "Flow Manager" in r.text
    print("OK")

def test_get_topology():
    print("Testing GET /topology...")
    r = requests.get(f"{BASE_URL}/topology")
    assert r.status_code == 200
    data = r.json()
    assert "switches" in data
    print(f"OK: Found {len(data['switches'])} switches")

def test_get_switches():
    print("Testing GET /data?list=switches...")
    r = requests.get(f"{BASE_URL}/data", params={"list": "switches"})
    assert r.status_code == 200
    print(f"OK: {r.json()}")

if __name__ == "__main__":
    try:
        test_get_index()
        test_get_topology()
        test_get_switches()
        print("\nAll basic REST tests passed!")
    except Exception as e:
        print(f"\nTests failed: {e}")
