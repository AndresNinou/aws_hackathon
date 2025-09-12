"""Claude Code integration API routes.

Exposes endpoints to analyze HAR files and generate an MCP server
following the guidelines in `agent/CREATE_MCP.md` using Claude Code SDK.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.log_config import logger
from app.services.claude_code_service import ClaudeCodeService

router = APIRouter(prefix="/claude", tags=["claude"])


class ClaudeMcpFromHarRequest(BaseModel):
    """Request model to build an MCP server from HAR files."""

    har_paths: List[str] = Field(
        ..., description="List of HAR file paths (absolute or repo-root-relative)"
    )
    server_name: Optional[str] = Field(
        default=None, description="Name for the MCP server (for documentation/output)"
    )
    port: Optional[int] = Field(
        default=8111, description="HTTP port to suggest in the run command"
    )
    output_dir: Optional[str] = Field(
        default="mcp", description="Directory (relative to repo root) to write the server files"
    )
    # Advanced controls
    allowed_tools: Optional[List[str]] = Field(
        default=None,
        description=(
            "List of tools to allow (default enables Read, Write, Grep, WebSearch, WebFetch). "
            "Add 'Bash' only if you trust the environment."
        ),
    )
    allow_bash: bool = Field(
        default=False, description="Permit the Bash tool (unsafe; disabled by default)"
    )
    permission_mode: Optional[str] = Field(
        default="bypassPermissions",
        description=(
            "Permission mode for tool use. 'bypassPermissions' proceeds without prompts."
        ),
    )
    max_turns: Optional[int] = Field(
        default=20, description="Maximum agent turns to allow for the task"
    )
    stream_logs: bool = Field(
        default=True,
        description=(
            "Stream Claude progress to backend logs (tool use, results, assistant text)."
        ),
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "har_paths": ["backend/test_network_requests.har"],
                "server_name": "test",
                "port": 8111,
                "output_dir": "mcp",
                "allowed_tools": ["Read", "Write", "Grep", "WebSearch", "WebFetch"],
                "allow_bash": False,
                "permission_mode": "bypassPermissions",
                "max_turns": 20,
                "stream_logs": True,
            }
        }
    }


class ClaudeMcpFromHarResponse(BaseModel):
    """Response model for MCP generation from HAR files."""

    success: bool
    final_message: Optional[str] = None
    mcp_server_path: Optional[str] = None
    run_command: Optional[str] = None
    logs: Optional[List[str]] = None
    error: Optional[str] = None


@router.post("/mcp/from-har", response_model=ClaudeMcpFromHarResponse)
async def create_mcp_from_har(
    request: ClaudeMcpFromHarRequest,
) -> ClaudeMcpFromHarResponse:
    """Create an MCP server from one or more HAR files using Claude Code SDK.

    The Claude Code agent is instructed to:
    - Read the provided HAR files
    - Follow FastMCP guidelines from `agent/CREATE_MCP.md`
    - Generate a minimal FastMCP server exposing tools for observed API endpoints
    - Return a final line: "done MCP created and running on http://127.0.0.1:<port>"
    """
    try:
        logger.info("Starting MCP generation from HAR files: {}", request.har_paths)
        svc = ClaudeCodeService()
        result: Dict[str, Any] = await svc.create_mcp_from_har(
            har_paths=request.har_paths,
            server_name=request.server_name,
            port=request.port,
            output_dir=request.output_dir,
            allowed_tools=request.allowed_tools,
            allow_bash=request.allow_bash,
            permission_mode=request.permission_mode,
            max_turns=request.max_turns,
            stream_logs=request.stream_logs,
        )
        return ClaudeMcpFromHarResponse(**result)
    except HTTPException:
        raise
    except Exception as e:  # pragma: no cover - safety net
        logger.error("Error creating MCP from HAR: {}", e)
        raise HTTPException(status_code=500, detail=f"MCP generation failed: {e}")
