import os
import json
import asyncio
from typing import AsyncGenerator, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage, AIMessage
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver

# Load environment variables
load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

app = FastAPI(title="Dilni Portfolio Agentic Backend")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Professional Context ---
CV_CONTEXT = """
Name: Dilni Rohansi Wijesinghe
Identity: Level 5 Computer Science undergraduate at IIT / University of Westminster.
Leadership: Founder & CTO / Head of Engineering at Tirl-Ops, focused on core codebase execution.
Education:
- BSc (Hons) Computer Science at Westminster University (Sep 2024 – Present). Modules include Machine Learning, Database Systems, Algorithms, Web Application Development, Client-Server Architecture, OOP, and Software Development.
- GCE Advanced Level (Biological Science) at Mahanama National College Monaragala (February 2024). Results: Biology - C, Chemistry - B, Physics - S.
- Certifications: Oracle Cloud Infrastructure 2025 Certified AI Foundations Associate, Java Programming for Beginners (2024).
Core Projects:
- Harvextro: An agricultural sorting robot arm using Python, OpenCV, and YOLOv8n to route Scotch Bonnet chilis into Red, Green, Yellow, and Mix buckets.
- Loan Approval & Limit Prediction System: Achieved a 99.9% prediction accuracy using an ensemble voting classifier in 2026.
- Graph Cycle Detector: Java-based tool using Sink Elimination and Depth First Search (DFS).
- Smart Campus Management API: Built with Java JAX-RS and Maven.
"""

SYSTEM_INSTRUCTION = f"""
You are Dilni's AI Twin, a digital version of Dilni Rohansi Wijesinghe. You must respond in the first person ("I", "me", "my") as if you are Dilni herself.
Your goal is to represent my professional identity with the confidence of an elite tech professional, while maintaining warmth, clarity, and human-like engagement.

Follow these stylistic rules:
1. **Persona**: You ARE Dilni. Never say "I am an AI" or "As an AI assistant". If asked who you are, say "I'm Dilni's AI Twin, here to chat about my software engineering journey."
2. **No Markdown**: NEVER use bullet points (like `-` or `*`) or bold markdown (like `**`). Write in plain, natural sentences and paragraphs only.
3. **Proactivity**: When a user asks about something that corresponds to a section on the website, YOU MUST use the `control_ui` tool to scroll them there immediately while you explain it.
4. **Structure**: Keep responses concise but warm. Use two to three clear paragraphs.
5. **Call to Action**: Always invite further questions about specific projects, skills, or collaboration.
6. **Tool Usage**: 
   - If they ask about my experience or projects, scroll to 'experience'.
   - If they ask about my skills or tech stack, scroll to 'skills'.
   - If they ask about my education or certifications, scroll to 'education'.
   - If they ask for my services, scroll to 'services'.
   - If they want to contact me or hire me, scroll to 'contact'.
   - If they ask for my resume/CV, use 'download' with 'resume'.

Context:
{CV_CONTEXT}
"""

# --- Tools ---
@tool
def control_ui(action: str, target: str) -> str:
    """
    Control the UI of the portfolio website.
    Actions: 'scroll', 'download'
    Targets for 'scroll': 'experience', 'skills', 'education', 'services', 'contact'
    Targets for 'download': 'resume'
    """
    return f"Executed {action} on {target}"

# --- Agent Setup ---
model = ChatOpenAI(
    model="openrouter/free",
    openai_api_key=OPENROUTER_API_KEY,
    openai_api_base="https://openrouter.ai/api/v1",
    default_headers={
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Dilni Portfolio Agent",
    },
    streaming=True
)

memory = MemorySaver()
agent_executor = create_react_agent(
    model, 
    tools=[control_ui], 
    checkpointer=memory,
    prompt=SYSTEM_INSTRUCTION
)

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default_session"

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="API Key not configured.")

    config = {"configurable": {"thread_id": request.session_id}}
    
    async def event_generator():
        # Using astream to get events from the agent
        # Use stream_mode="updates" to catch tool calls and messages separately
        async for event in agent_executor.astream(
            {"messages": [HumanMessage(content=request.message)]},
            config=config,
            stream_mode="updates"
        ):
            # The structure of event in "updates" mode:
            # {'agent': {'messages': [AIMessage(...)]}}
            # {'tools': {'messages': [ToolMessage(...)]}}
            
            if 'agent' in event:
                messages = event['agent'].get('messages', [])
                for msg in messages:
                    if isinstance(msg, AIMessage):
                        # 1. Send text content if it exists
                        if msg.content:
                            yield f"data: {json.dumps({'text': msg.content})}\n\n"
                        
                        # 2. Send tool calls if they exist
                        if msg.tool_calls:
                            for tool_call in msg.tool_calls:
                                if tool_call["name"] == "control_ui":
                                    args = tool_call["args"]
                                    cmd = f"UI_COMMAND::{args.get('action')}::{args.get('target')}"
                                    yield f"data: {json.dumps({'command': cmd})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8888)
