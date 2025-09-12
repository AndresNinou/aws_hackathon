#!/usr/bin/env python3
"""Test script for browser automation API."""

import asyncio
import json
import requests

API_BASE = "http://localhost:8000/api/v1"

def test_health():
    """Test the health endpoint."""
    print("Testing browser automation health...")
    try:
        response = requests.get(f"{API_BASE}/browser/health")
        print(f"Health check status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_browser_automation():
    """Test the browser automation endpoint."""
    print("\nTesting browser automation...")
    
    payload = {
        "url": "http://127.0.0.1:5000",
        "instruction": "click fetch products"
    }
    
    try:
        print(f"Sending request to {API_BASE}/browser/execute")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(
            f"{API_BASE}/browser/execute",
            json=payload,
            timeout=60  # Give it time to complete the browser action
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        return response.status_code == 200
        
    except Exception as e:
        print(f"Browser automation test failed: {e}")
        return False

def test_browser_recording():
    """Test the browser automation with recording endpoint."""
    print("\nTesting browser automation with recording...")
    
    payload = {
        "url": "http://127.0.0.1:5000",
        "instruction": "click fetch products",
        "har_path": "test_network_requests.har",
        "cookies_path": "test_cookies.json"
    }
    
    try:
        print(f"Sending request to {API_BASE}/browser/execute-with-recording")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(
            f"{API_BASE}/browser/execute-with-recording",
            json=payload,
            timeout=60
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        return response.status_code == 200
        
    except Exception as e:
        print(f"Browser recording test failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Browser Automation API\n")
    
    # Test health first
    if not test_health():
        print("❌ Health check failed, stopping tests")
        exit(1)
    
    print("✅ Health check passed")
    
    # Test basic browser automation
    if test_browser_automation():
        print("✅ Basic browser automation test passed")
    else:
        print("❌ Basic browser automation test failed")
    
    # Test browser automation with recording
    if test_browser_recording():
        print("✅ Browser automation with recording test passed")
    else:
        print("❌ Browser automation with recording test failed")
    
    print("\n🎉 Browser automation testing complete!")
