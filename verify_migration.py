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

def test_post_flow():
    print("Testing POST /flowform (Validation test)...")
    flow_data = {
        "dpid": "1",
        "operation": "add",
        "table_id": 0,
        "priority": 100,
        "match": {"eth_type": 2048},
        "apply": [{"OUTPUT": "CONTROLLER"}]
    }
    r = requests.post(f"{BASE_URL}/flowform", json=flow_data)
    # Even if switch doesn't exist, it should pass FastAPI validation and return 200
    # with an error message from ctrl_api
    assert r.status_code == 200
    data = r.json()
    assert "status" in data
    print(f"OK: {data}")

def test_invalid_flow():
    print("Testing POST /flowform (Invalid data test)...")
    invalid_data = {
        "dpid": "1",
        "priority": "not-an-int" # This should trigger FastAPI validation error
    }
    r = requests.post(f"{BASE_URL}/flowform", json=invalid_data)
    assert r.status_code == 422 # Unprocessable Entity
    print("OK: Correcty rejected invalid data")

if __name__ == "__main__":
    try:
        test_get_index()
        test_get_topology()
        test_get_switches()
        test_post_flow()
        test_invalid_flow()
        print("\nAll tests passed!")
    except Exception as e:
        print(f"\nTests failed: {e}")
