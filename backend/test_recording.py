#!/usr/bin/env python3
"""Test script for HAR recording and cookie saving functionality."""

import asyncio
import json
import os
from pathlib import Path
import requests

async def test_browser_recording():
    """Test browser automation with HAR recording and cookie saving."""
    print("🎬 Testing Browser Automation with HAR Recording & Cookie Saving")
    
    api_base = "http://localhost:8000/api/v1"
    
    # Test data
    payload = {
        "url": "http://127.0.0.1:5000",
        "instruction": "click fetch products",
        "har_path": "test_network_requests.har",
        "cookies_path": "test_cookies.json"
    }
    
    print(f"🚀 Sending request to {api_base}/browser/execute-with-recording")
    print(f"📄 Payload:")
    print(json.dumps(payload, indent=2))
    
    try:
        response = requests.post(
            f"{api_base}/browser/execute-with-recording",
            json=payload,
            timeout=120  # Give it more time for HAR recording
        )
        
        print(f"📊 Response Status: {response.status_code}")
        response_data = response.json()
        print(f"📋 Response:")
        print(json.dumps(response_data, indent=2))
        
        if response.status_code == 200 and response_data.get("success"):
            print("✅ Browser automation with recording completed successfully!")
            
            # Check if files were created
            har_path = response_data.get("har_path")
            cookies_path = response_data.get("cookies_path")
            
            if har_path and Path(har_path).exists():
                har_size = Path(har_path).stat().st_size
                print(f"✅ HAR file created: {har_path} ({har_size} bytes)")
            else:
                print(f"❌ HAR file not found: {har_path}")
            
            if cookies_path and Path(cookies_path).exists():
                with open(cookies_path, 'r') as f:
                    data = json.load(f)
                # Playwright storage_state is a dict with 'cookies' and 'origins'
                if isinstance(data, dict):
                    cookies = data.get('cookies', [])
                    print(f"✅ Storage state saved: {cookies_path} ({len(cookies)} cookies)")
                else:
                    # Fallback: some implementations may save cookies array directly
                    cookies = data
                    print(f"✅ Cookies saved: {cookies_path} ({len(cookies)} cookies)")

                # Display first few cookies (without sensitive data)
                if cookies:
                    print("🍪 Sample cookies:")
                    for i, cookie in enumerate(cookies[:3]):
                        print(f"  - {cookie.get('name', 'unknown')}: {cookie.get('domain', 'unknown')}")
                        if i >= 2:  # Show max 3 cookies
                            break
            else:
                print(f"❌ Cookies file not found: {cookies_path}")
            
            return True
        else:
            print(f"❌ Browser automation failed: {response_data.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

async def test_basic_recording():
    """Test basic browser automation first."""
    print("🧪 Testing Basic Browser Automation")
    
    api_base = "http://localhost:8000/api/v1"
    
    # Test basic functionality first
    payload = {
        "url": "http://127.0.0.1:5000",
        "instruction": "click fetch products"
    }
    
    try:
        response = requests.post(
            f"{api_base}/browser/execute",
            json=payload,
            timeout=60
        )
        
        print(f"📊 Basic test status: {response.status_code}")
        response_data = response.json()
        
        if response.status_code == 200 and response_data.get("success"):
            print("✅ Basic browser automation working!")
            return True
        else:
            print(f"❌ Basic automation failed: {response_data.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Basic test failed: {e}")
        return False

def test_health():
    """Test API health."""
    try:
        response = requests.get("http://localhost:8000/api/v1/browser/health")
        if response.status_code == 200:
            print("✅ API is healthy")
            return True
        else:
            print(f"❌ API health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Browser Automation Recording Test Suite\n")
    
    # Check API health
    if not test_health():
        print("❌ API not available, exiting...")
        exit(1)
    
    # Test basic automation first
    print("\n--- Test 1: Basic Browser Automation ---")
    if not asyncio.run(test_basic_recording()):
        print("❌ Basic automation failed, skipping recording test")
        exit(1)
    
    # Test recording functionality
    print("\n--- Test 2: HAR Recording & Cookie Saving ---")
    success = asyncio.run(test_browser_recording())
    
    if success:
        print("\n🎉 All tests passed! HAR recording and cookie saving are working!")
    else:
        print("\n❌ Recording test failed")
    
    print("\n📁 Check the current directory for:")
    print("  - test_network_requests.har (network requests)")
    print("  - test_cookies.json (saved cookies)")
