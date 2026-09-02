from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.llm import ChatRequest, ChatResponse, generate_copilot_response, generate_asset_explanation
from app.services.retrieval import get_asset_context, get_fleet_summary_context

router = APIRouter()

@router.post("", response_model=ChatResponse)
def chat_with_copilot(request: ChatRequest, db: Session = Depends(get_db)):
    # Simple intent parsing for context retrieval
    context_data = {}
    
    if request.asset_id:
        context_data = get_asset_context(db, request.asset_id)
    elif "underutil" in request.message.lower() or "risk" in request.message.lower() or "summary" in request.message.lower():
        context_data = get_fleet_summary_context(db)
    else:
        # Fallback context
        context_data = get_fleet_summary_context(db)
        
    return generate_copilot_response(db, request, context_data)

@router.get("/asset/{asset_id}/explanation", response_model=ChatResponse)
def get_asset_explanation(asset_id: str, db: Session = Depends(get_db)):
    context_data = get_asset_context(db, asset_id)
    if "error" in context_data:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    return generate_asset_explanation(db, asset_id, context_data)
