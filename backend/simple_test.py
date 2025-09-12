#!/usr/bin/env python3
"""Simple direct test of browser-use functionality."""

import asyncio
import os
from browser_use import Agent
from langchain_openai import ChatOpenAI

async def test_browser_use():
    """Test browser-use directly without the API."""
    print("🔧 Testing browser-use directly...")
    
    try:
        # Initialize ChatOpenAI
        llm = ChatOpenAI(
            model="gpt-4o",
            api_key=os.getenv("OPENAI_API_KEY"),
            temperature=0.1
        )
        
        task = """
        Open http://127.0.0.1:5000
        Wait for the page to load completely.
        Find and click the button whose text includes "Fetch products" (case-insensitive).
        """
        
        print(f"Creating agent with task: {task.strip()}")
        
        # Create agent
        agent = Agent(
            task=task.strip(),
            llm=llm,
        )
        
        print("🚀 Executing browser automation task...")
        result = await agent.run()
        
        print("✅ Browser automation completed successfully!")
        print(f"Result: {result}")
        return True
        
    except Exception as e:
        print(f"❌ Browser automation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_simple_navigation():
    """Test simple navigation to verify browser-use works."""
    print("🌐 Testing simple navigation...")
    
    try:
        llm = ChatOpenAI(
            model="gpt-4o", 
            api_key=os.getenv("OPENAI_API_KEY"),
            temperature=0.1
        )
        
        task = "Open https://example.com and wait for it to load."
        
        agent = Agent(
            task=task,
            llm=llm,
        )
        
        result = await agent.run()
        print("✅ Simple navigation test passed!")
        print(f"Result: {result}")
        return True
        
    except Exception as e:
        print(f"❌ Simple navigation test failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Direct Browser-Use Testing")
    
    # Check if we have the API key
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ OPENAI_API_KEY not found in environment")
        exit(1)
    
    print("✅ OPENAI_API_KEY found")
    
    # Run simple navigation test first
    print("\n--- Test 1: Simple Navigation ---")
    asyncio.run(test_simple_navigation())
    
    # Run target URL test
    print("\n--- Test 2: Target URL Automation ---")
    asyncio.run(test_browser_use())
    
    print("\n🎉 Testing complete!")
