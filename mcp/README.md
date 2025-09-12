# HAR API MCP Server

A FastMCP server that exposes tools to call APIs captured from network traffic analysis.

## Available Tools

- `get_home_page`: Fetch the home page HTML content
- `get_products`: Retrieve all products from the API endpoint

## Requirements

- Python 3.8+
- `fastmcp`
- `httpx`

## Installation

```bash
pip install fastmcp httpx
```

## Running the Server

### HTTP Transport (Port 8111)

```bash
fastmcp run mcp/har_api_server.py:mcp --transport http --port 8111
```

### STDIO Transport

```bash
fastmcp run mcp/har_api_server.py:mcp
```

## Usage Example

Once the server is running on HTTP transport, you can connect to it with any MCP client:

```python
import asyncio
from fastmcp import Client

async def example():
    client = Client("http://localhost:8111")
    async with client:
        # Get products
        products = await client.call_tool("get_products", {
            "base_url": "http://127.0.0.1:5000"
        })
        print(products)

asyncio.run(example())
```