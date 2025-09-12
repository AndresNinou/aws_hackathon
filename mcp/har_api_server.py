"""HAR API Server - FastMCP server exposing tools for captured API endpoints."""

import httpx
from fastmcp import FastMCP
from typing import Dict, Any, Optional

mcp = FastMCP("HAR API Server")


@mcp.tool
async def get_home_page(base_url: str = "http://127.0.0.1:5000") -> str:
    """
    Get the home page HTML content.
    
    Args:
        base_url: Base URL of the API server (default: http://127.0.0.1:5000)
    
    Returns:
        HTML content of the home page
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{base_url}/")
        response.raise_for_status()
        return response.text


@mcp.tool
async def get_products(
    base_url: str = "http://127.0.0.1:5000",
    headers: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Get all products from the API.
    
    Args:
        base_url: Base URL of the API server (default: http://127.0.0.1:5000)
        headers: Optional headers to include in the request
    
    Returns:
        JSON response containing products data
    """
    request_headers = {
        "Accept": "*/*",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
    }
    
    if headers:
        request_headers.update(headers)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{base_url}/api/products",
            headers=request_headers
        )
        response.raise_for_status()
        return response.json()


if __name__ == "__main__":
    mcp.run()