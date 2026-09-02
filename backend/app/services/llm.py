import os
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from openai import OpenAI
import json
from dotenv import load_dotenv

load_dotenv()

class ChatRequest(BaseModel):
    message: str
    asset_id: Optional[str] = None
    current_page: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    sources: list[str]
    model: str
    grounded: bool

def get_llm_client():
    api_key = os.environ.get("GROQ_API_KEY") or os.environ.get("OPENAI_API_KEY") or os.environ.get("LLM_API_KEY")
    if not api_key:
        return None
    # Use Groq OpenAI-compatible endpoint
    return OpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1"
    )

def generate_copilot_response(db: Session, request: ChatRequest, context_data: dict) -> ChatResponse:
    client = get_llm_client()
    if not client:
        return ChatResponse(
            answer="AI Copilot is unavailable because no LLM provider is configured. Please configure an LLM provider to enable grounded AI responses.",
            sources=[],
            model="none",
            grounded=False
        )

    # Build prompt
    system_prompt = """You are FleetIQ Copilot, an AI assistant for fleet managers.
Your job is to answer user questions based STRICTLY on the retrieved context below.
Do not invent telemetry, financial values, or recommendations.
If information is unavailable in the context, explicitly say so.
Do not execute actions or change state. Human approval is mandatory for all recommendations.
Never claim synthetic data is real data (preserve provenance).
Your response should be clear, professional, and formatted in Markdown.
"""

    context_str = json.dumps(context_data, indent=2, default=str)
    
    user_prompt = f"User Request: {request.message}\n\nCurrent Page: {request.current_page}\n\nRetrieved Context:\n{context_str}"

    try:
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2,
            max_tokens=500
        )
        answer = response.choices[0].message.content
        
        # Simple extraction of sources from context keys
        sources = list(context_data.keys())
        
        return ChatResponse(
            answer=answer,
            sources=sources,
            model="llama3-8b-8192",
            grounded=True
        )
    except Exception as e:
        print(f"LLM Error: {e}")
        return ChatResponse(
            answer=f"AI Copilot encountered an error communicating with the LLM provider. Deterministic FleetIQ functions remain available.",
            sources=[],
            model="error",
            grounded=False
        )

def generate_asset_explanation(db: Session, asset_id: str, context_data: dict) -> ChatResponse:
    client = get_llm_client()
    if not client:
        # Fallback to deterministic explanation
        return ChatResponse(
            answer="FleetIQ deterministic explanation: Real-time LLM insights are unavailable without an API key. Check risk dashboard for details.",
            sources=[],
            model="deterministic",
            grounded=True
        )
        
    system_prompt = """You are FleetIQ AI. 
Explain the current state, risk level, and utilization of this asset based ONLY on the provided context.
Keep it concise, professional, and do not hallucinate details.
"""

    context_str = json.dumps(context_data, indent=2, default=str)
    
    try:
        response = client.chat.completions.create(
            model="groq/compound",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Context for {asset_id}:\n{context_str}"}
            ],
            temperature=0.2,
            max_tokens=300
        )
        answer = response.choices[0].message.content
        return ChatResponse(
            answer=answer,
            sources=list(context_data.keys()),
            model="llama3-8b-8192",
            grounded=True
        )
    except Exception as e:
        return ChatResponse(
            answer="FleetIQ deterministic explanation: Error communicating with LLM.",
            sources=[],
            model="error",
            grounded=False
        )
