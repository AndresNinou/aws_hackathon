"""Browser automation agent service using browser-use library.

This service uses the browser-use library with LangChain OpenAI
to intelligently navigate and interact with websites based on natural language instructions.
Supports HAR recording and cookie saving for session management.
"""

import asyncio
import json
import os
from pathlib import Path
from typing import Any, Dict, Optional

from browser_use import Agent
from browser_use import Browser as BrowserSession
from langchain_openai import ChatOpenAI
from loguru import logger

from app.core.config import settings


class BrowserAgent:
    """AI-powered browser automation agent using browser-use library.
    
    Uses browser-use with BrowserSession for browser control and LangChain OpenAI
    for intelligent decision making based on natural language instructions.
    Supports HAR recording and cookie saving through Playwright context access.
    """

    def __init__(self):
        """Initialize the browser agent with OpenAI LLM."""
        # Verify OpenAI API key
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        # Initialize OpenAI LLM with browser-use compatible model
        self.llm = ChatOpenAI(
            model="gpt-4o",
            api_key=api_key,
            temperature=0.1  # Lower temperature for more consistent browser actions
        )
        
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        # browser-use handles cleanup automatically
        pass
            
    async def execute_instruction(self, url: str, instruction: str) -> Dict[str, Any]:
        """Navigate to a URL and execute the given instruction using browser-use.
        
        Args:
            url: URL to navigate to
            instruction: Natural language instruction for what to do
            
        Returns:
            Dictionary containing execution results
        """
        try:
            logger.info(f"Navigating to {url} with instruction: {instruction}")
            
            # Create the task with explicit URL navigation
            task = f"""
            Open {url}
            Wait for the page to load completely.
            {instruction}
            """
            
            # Create agent with browser-use's simplified API
            agent = Agent(
                task=task.strip(),
                llm=self.llm,
            )
            
            # Execute the task
            result = await agent.run()
            
            logger.info(f"Successfully executed browser task")
            
            return {
                "url": url,
                "instruction": instruction,
                "success": True,
                "result": str(result),
                "action_taken": f"Executed task: {instruction}",
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Error executing browser instruction: {e}")
            return {
                "url": url,
                "instruction": instruction,
                "success": False,
                "error": str(e),
                "result": None,
                "action_taken": None
            }

    async def execute_with_har_recording(
        self, 
        url: str, 
        instruction: str, 
        har_path: Optional[str] = None,
        cookies_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute instruction with HAR recording and cookie saving.
        
        Args:
            url: URL to navigate to
            instruction: Natural language instruction for what to do
            har_path: Optional path to save HAR file
            cookies_path: Optional path to save cookies
            
        Returns:
            Dictionary containing execution results and file paths
        """
        try:
            logger.info(f"Executing with recording - URL: {url}, HAR: {har_path}, Cookies: {cookies_path}")
            
            # Set default paths if not provided
            if har_path is None:
                har_path = str(Path("network_requests.har").resolve())
            if cookies_path is None:
                cookies_path = str(Path("cookies.json").resolve())
            
            # Create BrowserSession with minimal HAR recording enabled
            browser_session = BrowserSession(
                record_har_path=har_path,
                record_har_content="omit",  # Omit response content for minimal size
                record_har_mode="minimal",  # Minimal recording mode - network only
            )
            
            # Create the task with explicit URL navigation
            task = f"""
            Open {url}
            Wait for the page to load completely.
            {instruction}
            """
            
            # Create agent with custom browser session
            agent = Agent(
                task=task.strip(),
                llm=self.llm,
                browser_session=browser_session
            )
            
            # Execute the task
            result = await agent.run()
            
            # Save storage state (cookies + localStorage) after task execution and close context to flush HAR
            try:
                # Access the playwright context through the browser session
                if hasattr(browser_session, 'context') and browser_session.context:
                    state = await browser_session.context.storage_state(path=cookies_path)
                    logger.info(
                        f"Saved storage_state to {cookies_path} with {len(state.get('cookies', []))} cookies"
                    )
                else:
                    logger.warning("Could not access browser context for storage_state extraction")
            except Exception as cookie_error:
                logger.error(f"Error saving storage_state: {cookie_error}")
            finally:
                # Ensure context is closed so HAR file is finalized on disk
                try:
                    if hasattr(browser_session, 'context') and browser_session.context:
                        await browser_session.context.close()
                except Exception as close_error:
                    logger.warning(f"Error closing browser context after recording: {close_error}")
            
            logger.info(f"Successfully executed browser task with recording")
            
            return {
                "url": url,
                "instruction": instruction,
                "success": True,
                "result": str(result),
                "action_taken": f"Executed task with HAR recording: {instruction}",
                "har_path": har_path,
                "cookies_path": cookies_path,
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Error executing browser instruction with recording: {e}")
            return {
                "url": url,
                "instruction": instruction,
                "success": False,
                "error": str(e),
                "result": None,
                "action_taken": None,
                "har_path": har_path if 'har_path' in locals() else None,
                "cookies_path": cookies_path if 'cookies_path' in locals() else None
            }


async def create_browser_agent() -> BrowserAgent:
    """Factory function to create a browser agent."""
    return BrowserAgent()
