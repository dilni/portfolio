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
Leadership: Founder & CTO / Head of Engineering at Tirl-Ops.
Education:
- BSc (Hons) Computer Science at Westminster University (Sep 2024 – Present). Modules include Machine Learning, Database Systems, Algorithms, Web Application Development, Client-Server Architecture, OOP, and Software Development.
- GCE Advanced Level (Biological Science) at Mahanama National College Monaragala (February 2024). Results: Biology - C, Chemistry - B, Physics - S.
- Certifications: Oracle Cloud Infrastructure 2025 Certified AI Foundations Associate, Java Programming for Beginners (2024).
Core Projects:
- Smart Campus: Sensor & Room Management System: Designed and implemented a scalable RESTful API architecture using Java JAX-RS and Maven. Features include HATEOAS navigation, centralized exception handling, and thread-safe processing for campus-wide environmental monitoring (CO2 & Temperature).
- AI_Study_Buddy (Intelligent Learning Workspace): Lead Developer & Architect. Built an AI-powered academic ecosystem using TanStack Start (React 19), OpenRouter, and Supabase. Features local edge-side text extraction (PDF.js, Mammoth.js), context-aware tutoring (16,000 char window), automated MCQ generation, and a custom PDF export engine.
- Tirl-Ops (Native Task Orchestration Platform): Co-Founder & CTO. Architected a native desktop ecosystem using Electron.js and React 19. Implemented real-time task orchestration, Kanban workflows, and data-driven team analytics with sub-10ms state updates and 60 FPS UI performance.
- Harvextro: Autonomous Harvesting Robot Arm. Developed a YOLOv8 Nano–based computer vision model to detect and classify Scotch Bonnet chilies by ripeness for autonomous sorting. Managed primary dataset collection from commercial farms across Sri Lanka.
- Loan Approval & Limit Prediction System: Developed a loan approval and credit limit prediction system using an ensemble voting classifier, achieving 99.9% classification accuracy.
- Graph Cycle Detector Application: A highly optimized Java utility built to analyze complex topological networks. Implemented iterative Sink Elimination and recursive DFS algorithms with optimal linear time complexity ($O(V + E)$).
- Air Quality, Weather & Respiratory Health Analysis: Built predictive linear regression models mapping pollution fluctuations to hospital admission spikes using Pandas and Scikit-learn.
- Traffic Data Analysis Application (2024): Analyzed municipal transportation datasets (100,000+ rows) to map congestion zones using Pandas and Matplotlib.
- EcoSpark - Climate Action Website (2024): An interactive 8-page responsive web application for climate awareness (UN SDG 13), built with high-performance semantic HTML5/CSS3.
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
