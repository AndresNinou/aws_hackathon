import asyncio
from pathlib import Path

from browser_use import Agent, Browser
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

HAR_PATH = Path("network_requests.har").resolve()
COOKIES_PATH = Path("cookies.json").resolve()
START_URL = "http://localhost:5000"

TASK = """
Open http://localhost:5000
Wait for the page to load.
Find and click the button whose text includes "Fetch products" (case-insensitive).
"""

async def run_agent_and_capture():
    llm = ChatOpenAI(model="gpt-4o")  # fast/cheap reasoning for UI steps

    # Create agent with browser-use's simplified API
    agent = Agent(
        task=TASK.strip(),
        llm=llm,
    )

    print("▶️  Starting agent (will open http://localhost:5000 and click 'Fetch products') …")
    result = await agent.run()
    print("✅ Done.")
    print(f"Result: {result}")

if __name__ == "__main__":
    asyncio.run(run_agent_and_capture())
