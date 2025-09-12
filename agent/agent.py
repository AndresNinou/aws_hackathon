"""
Claude Code SDK Agent Implementation

This module provides a high-level interface for interacting with Claude using the Claude Code SDK.
It includes secure API key handling, conversation management, and various utility functions.
"""

import os
import asyncio
import json
from typing import Optional, List, Dict, Any, AsyncIterator
from pathlib import Path

from client import ClaudeSDKClient
from types import ClaudeCodeOptions, Message, AssistantMessage, TextBlock, ResultMessage


class ClaudeAgent:
    """
    A high-level Claude SDK agent for AWS Hackathon project.
    
    Features:
    - Secure API key handling
    - Conversation management
    - Streaming responses
    - Error handling and reconnection
    - Cost tracking
    """
    
    def __init__(self, api_key: Optional[str] = None, options: Optional[ClaudeCodeOptions] = None):
        """
        Initialize the Claude Agent.
        
        Args:
            api_key: Claude API key. If None, will look for ANTHROPIC_API_KEY env var
            options: Claude Code options for configuration
        """
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("API key must be provided either as parameter or ANTHROPIC_API_KEY environment variable")
            
        # Set the API key in environment for the SDK
        os.environ["ANTHROPIC_API_KEY"] = self.api_key
        
        # Initialize Claude Code options
        self.options = options or ClaudeCodeOptions()
        self.client: Optional[ClaudeSDKClient] = None
        self.is_connected = False
        self.conversation_history = []
        self.total_cost = 0.0
        
    async def connect(self) -> None:
        """Connect to Claude Code SDK."""
        try:
            self.client = ClaudeSDKClient(self.options)
            await self.client.connect()
            self.is_connected = True
            print("✅ Connected to Claude successfully!")
        except Exception as e:
            print(f"❌ Failed to connect to Claude: {e}")
            raise
    
    async def disconnect(self) -> None:
        """Disconnect from Claude Code SDK."""
        if self.client and self.is_connected:
            await self.client.disconnect()
            self.is_connected = False
            print("🔌 Disconnected from Claude")
    
    async def send_message(self, message: str, session_id: str = "default") -> AsyncIterator[Message]:
        """
        Send a message to Claude and stream the response.
        
        Args:
            message: The message to send to Claude
            session_id: Session identifier for conversation context
            
        Yields:
            Message objects from Claude's response
        """
        if not self.client or not self.is_connected:
            raise RuntimeError("Agent is not connected. Call connect() first.")
        
        try:
            # Send the message
            await self.client.query(message, session_id)
            
            # Stream the response
            async for response_msg in self.client.receive_response():
                # Track conversation history
                if isinstance(response_msg, (AssistantMessage, ResultMessage)):
                    self.conversation_history.append({
                        "timestamp": asyncio.get_event_loop().time(),
                        "session_id": session_id,
                        "user_message": message,
                        "claude_response": response_msg
                    })
                
                # Track costs
                if isinstance(response_msg, ResultMessage):
                    if hasattr(response_msg, 'total_cost_usd'):
                        self.total_cost += response_msg.total_cost_usd
                
                yield response_msg
                
        except Exception as e:
            print(f"❌ Error sending message: {e}")
            raise
    
    async def chat(self, message: str, session_id: str = "default") -> str:
        """
        Send a message and return the complete text response.
        
        Args:
            message: The message to send to Claude
            session_id: Session identifier for conversation context
            
        Returns:
            The complete text response from Claude
        """
        response_text = ""
        
        async for msg in self.send_message(message, session_id):
            if isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        response_text += block.text
            elif isinstance(msg, ResultMessage):
                # Response is complete
                break
        
        return response_text
    
    async def get_server_info(self) -> Optional[Dict[str, Any]]:
        """Get Claude Code server information."""
        if not self.client or not self.is_connected:
            raise RuntimeError("Agent is not connected. Call connect() first.")
        
        return await self.client.get_server_info()
    
    def get_conversation_history(self) -> List[Dict[str, Any]]:
        """Get the conversation history."""
        return self.conversation_history.copy()
    
    def get_total_cost(self) -> float:
        """Get the total cost incurred so far."""
        return self.total_cost
    
    async def __aenter__(self):
        """Async context manager entry."""
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.disconnect()


# Utility functions for easy usage
async def quick_chat(message: str, api_key: Optional[str] = None) -> str:
    """
    Quick one-off chat with Claude.
    
    Args:
        message: The message to send to Claude
        api_key: Optional API key (uses env var if not provided)
        
    Returns:
        Claude's response as text
    """
    async with ClaudeAgent(api_key) as agent:
        return await agent.chat(message)


async def stream_chat(message: str, api_key: Optional[str] = None) -> AsyncIterator[str]:
    """
    Stream a chat response from Claude.
    
    Args:
        message: The message to send to Claude
        api_key: Optional API key (uses env var if not provided)
        
    Yields:
        Text chunks from Claude's response
    """
    async with ClaudeAgent(api_key) as agent:
        async for msg in agent.send_message(message):
            if isinstance(msg, AssistantMessage):
                for block in msg.content:
                    if isinstance(block, TextBlock):
                        yield block.text


# Example usage and testing functions
async def test_basic_functionality(api_key: str):
    """Test basic Claude SDK functionality."""
    print("🧪 Testing Claude SDK integration...")
    
    try:
        # Test 1: Basic connection
        print("\n1️⃣ Testing connection...")
        async with ClaudeAgent(api_key) as agent:
            info = await agent.get_server_info()
            print(f"   ✅ Connected successfully. Server info available: {info is not None}")
            
            # Test 2: Simple chat
            print("\n2️⃣ Testing simple chat...")
            response = await agent.chat("Hello! Can you tell me what 2+2 equals?")
            print(f"   ✅ Chat response: {response[:100]}...")
            
            # Test 3: Streaming chat
            print("\n3️⃣ Testing streaming response...")
            print("   📝 Streaming response: ", end="")
            async for msg in agent.send_message("Tell me a short joke"):
                if isinstance(msg, AssistantMessage):
                    for block in msg.content:
                        if isinstance(block, TextBlock):
                            print(block.text, end="", flush=True)
                elif isinstance(msg, ResultMessage):
                    print(f"\n   💰 Cost: ${msg.total_cost_usd:.4f}" if hasattr(msg, 'total_cost_usd') else "")
                    break
            
            # Test 4: Check conversation history
            print(f"\n4️⃣ Conversation history: {len(agent.get_conversation_history())} messages")
            print(f"   💰 Total cost so far: ${agent.get_total_cost():.4f}")
            
        print("\n✅ All tests passed!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        raise


async def interactive_demo(api_key: str):
    """Interactive demo of the Claude agent."""
    print("🎯 Starting interactive Claude demo...")
    print("💡 Type 'quit' to exit")
    
    async with ClaudeAgent(api_key) as agent:
        while True:
            try:
                user_input = input("\n👤 You: ")
                if user_input.lower() in ['quit', 'exit']:
                    break
                
                print("🤖 Claude: ", end="", flush=True)
                async for msg in agent.send_message(user_input):
                    if isinstance(msg, AssistantMessage):
                        for block in msg.content:
                            if isinstance(block, TextBlock):
                                print(block.text, end="", flush=True)
                    elif isinstance(msg, ResultMessage):
                        if hasattr(msg, 'total_cost_usd'):
                            print(f"\n💰 Message cost: ${msg.total_cost_usd:.4f}")
                        break
                
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    # Set your API key here for testing
    API_KEY = os.getenv("ANTHOPIC_API_KEY")
    
    async def main():
        """Main function to run tests and demo."""
        # Run basic functionality tests
        await test_basic_functionality(API_KEY)
        
        # Ask user if they want to run interactive demo
        try:
            demo_choice = input("\n🎮 Would you like to run the interactive demo? (y/N): ")
            if demo_choice.lower() in ['y', 'yes']:
                await interactive_demo(API_KEY)
        except (EOFError, KeyboardInterrupt):
            print("\n👋 Goodbye!")
    
    # Run the main function
    asyncio.run(main())