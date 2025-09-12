from fastmcp import FastMCP
import httpx
from typing import Optional, Dict, Any

mcp = FastMCP("HAR API Server")

@mcp.tool
def get_home_page(base_url: str = "http://127.0.0.1:5000") -> str:
    """
    Get the home page HTML content.
    
    Args:
        base_url: The base URL of the API server (default: http://127.0.0.1:5000)
        
    Returns:
        HTML content of the home page
    """
    with httpx.Client() as client:
        response = client.get(f"{base_url}/")
        response.raise_for_status()
        return response.text

@mcp.tool  
def get_products(base_url: str = "http://127.0.0.1:5000", headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Get the list of products from the API.
    
    Args:
        base_url: The base URL of the API server (default: http://127.0.0.1:5000)
        headers: Optional custom headers to include in the request
        
    Returns:
        JSON response containing the product list
    """
    request_headers = {
        "Accept": "*/*",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
    }
    
    if headers:
        request_headers.update(headers)
    
    with httpx.Client() as client:
        response = client.get(f"{base_url}/api/products", headers=request_headers)
        response.raise_for_status()
        return response.json()


if __name__ == "__main__":
    mcp.run()