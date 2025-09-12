import os
from fastapi.testclient import TestClient

from app.main import app


def test_create_mcp_from_har_success(monkeypatch, tmp_path):
    """Endpoint returns success and final message when service succeeds.

    Service call is patched to avoid hitting external SDK or filesystem.
    """

    def fake_create(self, har_paths, server_name=None, port=None, output_dir=None):
        return {
            "success": True,
            "final_message": f"done MCP created and running on http://127.0.0.1:{port or 8111}",
            "mcp_server_path": str(tmp_path / "mcp" / "har_api_server.py"),
            "run_command": "fastmcp run mcp/har_api_server.py:mcp --transport http --port 8111",
            "logs": ["created"],
        }

    # Patch service method
    from app.services.claude_code_service import ClaudeCodeService

    monkeypatch.setattr(
        ClaudeCodeService, "create_mcp_from_har", fake_create, raising=True
    )

    client = TestClient(app)
    payload = {
        "har_paths": ["backend/test_network_requests.har"],
        "server_name": "Test HAR MCP",
        "port": 8111,
        "output_dir": "mcp",
    }

    resp = client.post("/api/v1/claude/mcp/from-har", json=payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["success"] is True
    assert data["final_message"].startswith("done MCP created and running on http://127.0.0.1:")
    assert "run_command" in data
