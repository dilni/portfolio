from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
import os

os.environ["OPENROUTER_API_KEY"] = "test"
model = ChatOpenAI(model="test", openai_api_key="test")
tools = []
try:
    agent = create_react_agent(model, tools, prompt="test")
    print("Success with prompt")
except TypeError as e:
    print(f"Failed with prompt: {e}")

try:
    agent = create_react_agent(model, tools, state_modifier="test")
    print("Success with state_modifier")
except TypeError as e:
    print(f"Failed with state_modifier: {e}")
