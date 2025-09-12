"""Claude Code orchestration service.

This service uses the Claude Code SDK to analyze HAR files and generate a
FastMCP server following the guidelines in `agent/CREATE_MCP.md`.
"""

from __future__ import annotations

import asyncio
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.core.log_config import logger

try:
    # Claude Code SDK is optional at import-time to avoid crashing the app if missing
    from claude_code_sdk import (
        query,
        ClaudeCodeOptions,
        AssistantMessage,
        TextBlock,
        ToolUseBlock,
        ToolResultBlock,
    )
except Exception as e:  # pragma: no cover - handled gracefully at runtime
    query = None  # type: ignore
    ClaudeCodeOptions = None  # type: ignore
    AssistantMessage = None  # type: ignore
    TextBlock = None  # type: ignore
    logger.warning("Claude Code SDK not available: {}", e)


class ClaudeCodeService:
    """Orchestrates Claude Code to build an MCP server from HAR files."""

    def __init__(self) -> None:
        # Validate environment for Claude Code
        self.repo_root = Path(__file__).resolve().parents[3]
        self.agent_guidelines_path = self.repo_root / "agent" / "CREATE_MCP.md"
        self.default_output_dir = self.repo_root / "mcp"
        self.default_output_dir.mkdir(parents=True, exist_ok=True)

        if query is None or ClaudeCodeOptions is None:
            logger.warning(
                "Claude Code SDK not installed. Install with: pip install claude-code-sdk"
            )

        # Normalize Anthropic API key env var (handle common typo: ANTHOPIC_*)
        anthropic_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("ANTHOPIC_API_KEY")
        if anthropic_key and not os.getenv("ANTHROPIC_API_KEY"):
            # Export the correctly spelled variable for SDK/CLI compatibility
            os.environ["ANTHROPIC_API_KEY"] = anthropic_key
            logger.info("Set ANTHROPIC_API_KEY from ANTHOPIC_API_KEY for SDK compatibility")
        if not anthropic_key:
            logger.warning(
                "Anthropic API key not set (ANTHROPIC_API_KEY/ANTHOPIC_API_KEY). SDK calls will fail."
            )

    async def create_mcp_from_har(
        self,
        har_paths: List[str],
        server_name: Optional[str] = None,
        port: Optional[int] = None,
        output_dir: Optional[str] = None,
        *,
        allowed_tools: Optional[List[str]] = None,
        allow_bash: bool = False,
        permission_mode: Optional[str] = None,
        max_turns: Optional[int] = None,
        stream_logs: bool = True,
    ) -> Dict[str, Any]:
        """Analyze HAR files and ask Claude Code to produce an MCP server.

        Args:
            har_paths: List of HAR file paths (absolute or relative to repo root)
            server_name: Human-friendly MCP server name
            port: Optional HTTP port to suggest in the run command
            output_dir: Target directory for generated MCP server code (relative or absolute)

        Returns:
            Dict with success flag, final_message, logs, server_path, command
        """
        if query is None or ClaudeCodeOptions is None:
            return {
                "success": False,
                "error": "claude-code-sdk is not installed",
            }

        # Normalize paths relative to repo root for the Claude Code SDK "Read" tool
        norm_hars: List[str] = []
        for p in har_paths:
            pp = Path(p)
            if not pp.is_absolute():
                pp = (self.repo_root / p).resolve()
            if not pp.exists():
                return {"success": False, "error": f"HAR file not found: {pp}"}
            # Provide repo-root-relative path for Read tool visibility
            try:
                rel = str(pp.relative_to(self.repo_root))
            except ValueError:
                # If outside repo, still pass absolute path; Read may fail
                rel = str(pp)
            norm_hars.append(rel)

        if output_dir:
            out_dir = Path(output_dir)
            if not out_dir.is_absolute():
                out_dir = (self.repo_root / output_dir).resolve()
        else:
            out_dir = self.default_output_dir
        out_dir.mkdir(parents=True, exist_ok=True)

        server_name = server_name or "HAR MCP Server"
        port = port or 8111

        server_rel_path = Path("mcp") / "har_api_server.py"
        server_abs_path = self.repo_root / server_rel_path
        readme_rel_path = Path("mcp") / "README.md"

        # Construct the prompt for Claude Code
        files_list = "\n".join(f"- {p}" for p in norm_hars)
        prompt = f"""
You are an expert backend engineer and MCP implementer. Your task:

1) Analyze the network traffic captured in these HAR files (use the Read tool):
{files_list}

2) Following the FastMCP quickstart guidelines in file `agent/CREATE_MCP.md` (read it), create a minimal but functional FastMCP server that exposes tools to call the APIs you infer from the HAR capture. The goal is to produce an SDK-friendly MCP server that a client can connect to and invoke API calls.

Implementation requirements:
- Server file path: {server_rel_path}
- The file must define a top-level FastMCP instance variable named `mcp`.
- Implement at least one tool per distinct API endpoint observed in the HAR (e.g., get_products, get_product_by_id, create_order, etc.).
- Use Python `httpx` for HTTP calls inside the tools.
- Keep the implementation minimal and dependency-light. Add docstrings for each tool with input params and expected output.
- Create a short README at {readme_rel_path} explaining how to run the server.
- Do NOT hardcode secrets; read base URLs and headers from tool parameters where appropriate.
 - In the README, include a "Next Steps" section that explicitly instructs the user to run the server using the command in step 3.

3) Provide a run command (do not execute) to start the MCP server via HTTP transport on port {port}:
   fastmcp run {server_rel_path}:mcp --transport http --port {port}

4) When you finish writing files, respond EXACTLY with the final line (no extra text):
   done MCP created and running on http://127.0.0.1:{port}
""".strip()

        # Configure Claude Code session
        # Determine tool permissions
        tools = list(allowed_tools) if allowed_tools is not None else [
            "Read",
            "Write",
            "Grep",
            "WebSearch",
            "WebFetch",
        ]
        if allow_bash and "Bash" not in tools:
            tools.append("Bash")

        options = ClaudeCodeOptions(
            cwd=str(self.repo_root),
            allowed_tools=tools,
            # Accept all tool uses without interactive prompts
            permission_mode=permission_mode or "bypassPermissions",
            # Give the agent ample turns to complete the work
            max_turns=max_turns or 20,
        )

        logs: List[str] = []
        final_message: Optional[str] = None
        try:
            async for message in query(prompt=prompt, options=options):
                # Stream progress to server logs
                if isinstance(message, AssistantMessage):
                    for block in getattr(message, "content", []) or []:
                        if isinstance(block, TextBlock):
                            text = block.text or ""
                            logs.append(text)
                            if stream_logs:
                                logger.info("[Claude] {}", text)
                            if "done MCP created and running on http://127.0.0.1:" in text:
                                final_message = text.strip().splitlines()[-1]
                        elif ToolUseBlock is not None and isinstance(block, ToolUseBlock):  # type: ignore[arg-type]
                            try:
                                name = getattr(block, "name", "tool")
                                input_json = getattr(block, "input", None)
                                msg = f"[Claude][ToolUse] {name}: {input_json}"
                            except Exception:
                                msg = f"[Claude][ToolUse] {block}"
                            logs.append(msg)
                            if stream_logs:
                                logger.info(msg)
                        elif ToolResultBlock is not None and isinstance(block, ToolResultBlock):  # type: ignore[arg-type]
                            try:
                                name = getattr(block, "tool_name", "tool")
                                output_json = getattr(block, "output", None)
                                msg = f"[Claude][ToolResult] {name}: {output_json}"
                            except Exception:
                                msg = f"[Claude][ToolResult] {block}"
                            logs.append(msg)
                            if stream_logs:
                                logger.info(msg)
        except Exception as e:
            logger.error("Claude Code session failed: {}", e)
            return {"success": False, "error": str(e), "logs": logs}

        result: Dict[str, Any] = {
            # Only succeed when the exact final line was observed
            "success": bool(final_message),
            "final_message": final_message,
            "logs": logs[-100:],  # limit size but include more context
            "mcp_server_path": str(server_abs_path),
            "run_command": f"fastmcp run {server_rel_path}:mcp --transport http --port {port}",
            "instructions": (
                "MCP server generated. To run it locally, execute:\n"
                f"fastmcp run {server_rel_path}:mcp --transport http --port {port}\n"
                f"Then connect your MCP client to http://127.0.0.1:{port}. See {readme_rel_path} for details."
            ),
        }
        return result


# Convenience for manual testing
async def _self_test() -> None:  # pragma: no cover
    svc = ClaudeCodeService()
    har = list((svc.repo_root / "backend").glob("*.har"))
    if not har:
        print("No HAR found in backend/. Run a browser recording first.")
        return
    res = await svc.create_mcp_from_har([str(har[0])])
    print(res)


if __name__ == "__main__":  # pragma: no cover
    asyncio.run(_self_test())
