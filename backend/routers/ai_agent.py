import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db, CallTaskDB
from models import AIAgentCallCreate, CallTaskResponse, CallStatus, CallType
from services.vapi_service import create_vapi_outbound_call, get_vapi_call

router = APIRouter(prefix="/calls", tags=["ai-agent"])


@router.post("/ai-agent", response_model=CallTaskResponse, status_code=201)
async def create_ai_agent_call(
    request: AIAgentCallCreate, db: Session = Depends(get_db)
):
    now = int(time.time() * 1000)
    db_call = CallTaskDB(
        phone_number=request.phone_number,
        contact_name="Stanford Golf Course",
        scheduled_time=now,
        status=CallStatus.IN_PROGRESS.value,
        created_at=now,
        call_type=CallType.AI_AGENT.value,
        booking_date=request.booking_date,
        booking_time=request.booking_time,
        num_players=request.num_players,
        player_name=request.player_name,
    )
    db.add(db_call)
    db.commit()
    db.refresh(db_call)

    try:
        vapi_response = await create_vapi_outbound_call(
            phone=request.phone_number,
            date=request.booking_date,
            time=request.booking_time,
            players=request.num_players,
            call_id=db_call.id,
            player_name=request.player_name,
        )
        db_call.vapi_call_id = vapi_response.get("id")
        db.commit()
        db.refresh(db_call)
    except Exception as e:
        db_call.status = CallStatus.FAILED.value
        db_call.ai_summary = f"Failed to initiate call: {str(e)}"
        db.commit()
        db.refresh(db_call)
        raise HTTPException(status_code=502, detail=f"Vapi API error: {str(e)}")

    return db_call


@router.get("/{call_id}/status", response_model=CallTaskResponse)
def get_call_status(call_id: int, db: Session = Depends(get_db)):
    call = db.query(CallTaskDB).filter(CallTaskDB.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call


@router.post("/{call_id}/refresh", response_model=CallTaskResponse)
async def refresh_call_from_vapi(call_id: int, db: Session = Depends(get_db)):
    call = db.query(CallTaskDB).filter(CallTaskDB.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    if not call.vapi_call_id:
        raise HTTPException(status_code=400, detail="No Vapi call ID associated")

    try:
        vapi_data = await get_vapi_call(call.vapi_call_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Vapi API error: {str(e)}")

    vapi_status = vapi_data.get("status", "")
    if vapi_status == "ended":
        analysis = vapi_data.get("analysis", {})
        structured = analysis.get("structuredData", {})
        call.transcript = vapi_data.get("transcript", "")
        call.ai_summary = analysis.get("summary", "")
        call.booking_confirmed = structured.get("booking_confirmed", False)
        call.ended_reason = vapi_data.get("endedReason", "")
        call.status = (
            CallStatus.COMPLETED.value
            if call.booking_confirmed
            else CallStatus.FAILED.value
        )
    elif vapi_status in ("queued", "ringing", "in-progress"):
        call.status = CallStatus.IN_PROGRESS.value

    db.commit()
    db.refresh(call)
    return call
