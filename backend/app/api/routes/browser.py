"""Browser automation API routes.

Provides endpoints for automated browser interactions using browser-use library
with AI-powered decision making to navigate and interact with websites.
"""

from typing import Dict, Any, Optional

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, HttpUrl

from app.services.browser_agent import BrowserAgent
from app.core.log_config import logger

router = APIRouter(prefix="/browser", tags=["browser"])


class BrowserActionRequest(BaseModel):
    """Request model for browser automation actions."""
    url: HttpUrl
    instruction: str
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "url": "http://127.0.0.1:5000",
                "instruction": "click fetch products"
            }
        }
    }


class BrowserRecordingRequest(BaseModel):
    """Request model for browser automation with HAR recording."""
    url: HttpUrl
    instruction: str
    har_path: Optional[str] = None
    cookies_path: Optional[str] = None
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "url": "http://127.0.0.1:5000",
                "instruction": "click fetch products",
                "har_path": "network_requests.har",
                "cookies_path": "cookies.json"
            }
        }
    }


class BrowserActionResponse(BaseModel):
    """Response model for browser automation actions."""
    success: bool
    url: str
    instruction: str
    action_taken: str | None = None
    result: str | None = None
    error: str | None = None


class BrowserRecordingResponse(BaseModel):
    """Response model for browser automation with recording."""
    success: bool
    url: str
    instruction: str
    action_taken: str | None = None
    result: str | None = None
    har_path: str | None = None
    cookies_path: str | None = None
    error: str | None = None


@router.post("/execute", response_model=BrowserActionResponse)
async def execute_browser_action(request: BrowserActionRequest) -> BrowserActionResponse:
    """Execute a browser automation action.
    
    Takes a URL and natural language instruction, then uses browser-use library
    to determine what actions to take on the webpage to fulfill the instruction.
    
    Args:
        request: Browser action request containing URL and instruction
        
    Returns:
        Results of the browser automation including actions taken
    """
    try:
        logger.info(f"Executing browser action: {request.instruction} on {request.url}")
        
        async with BrowserAgent() as agent:
            result = await agent.execute_instruction(str(request.url), request.instruction)
            
        return BrowserActionResponse(
            success=result.get("success", False),
            url=result.get("url", str(request.url)),
            instruction=result.get("instruction", request.instruction),
            action_taken=result.get("action_taken"),
            result=result.get("result"),
            error=result.get("error")
        )
        
    except Exception as e:
        logger.error(f"Error in browser automation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Browser automation failed: {str(e)}"
        )


@router.post("/execute-with-recording", response_model=BrowserRecordingResponse)
async def execute_with_recording(request: BrowserRecordingRequest) -> BrowserRecordingResponse:
    """Execute a browser automation action with HAR recording and cookie saving.
    
    Takes a URL and natural language instruction, executes the action,
    and records network requests in HAR format while saving cookies.
    
    Args:
        request: Browser recording request containing URL, instruction, and file paths
        
    Returns:
        Results of the browser automation with recording file paths
    """
    try:
        logger.info(f"Executing browser action with recording: {request.instruction} on {request.url}")
        
        async with BrowserAgent() as agent:
            result = await agent.execute_with_har_recording(
                str(request.url), 
                request.instruction,
                request.har_path,
                request.cookies_path
            )
            
        return BrowserRecordingResponse(
            success=result.get("success", False),
            url=result.get("url", str(request.url)),
            instruction=result.get("instruction", request.instruction),
            action_taken=result.get("action_taken"),
            result=result.get("result"),
            har_path=result.get("har_path"),
            cookies_path=result.get("cookies_path"),
            error=result.get("error")
        )
        
    except Exception as e:
        logger.error(f"Error in browser automation with recording: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Browser automation with recording failed: {str(e)}"
        )


@router.get("/health")
async def browser_health_check() -> Dict[str, str]:
    """Health check for browser automation service.
    
    Verifies that the browser automation dependencies are available
    and the service can be initialized.
    """
    try:
        # Test browser-use and dependencies
        from browser_use import Agent
        from langchain_openai import ChatOpenAI
        
        # Check if OpenAI API key is available
        import os
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return {"status": "error", "message": "OPENAI_API_KEY not configured"}
        
        return {"status": "healthy", "message": "Browser automation service is ready with browser-use"}
        
    except ImportError as e:
        return {"status": "error", "message": f"Missing dependencies: {str(e)}"}
    except Exception as e:
        return {"status": "error", "message": f"Service error: {str(e)}"}
