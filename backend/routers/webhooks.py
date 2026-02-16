from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session

from database import get_db, CallTaskDB
from models import CallStatus

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/vapi")
async def vapi_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    message_type = body.get("message", {}).get("type", "")

    # Extract call metadata to find our DB record
    call_obj = body.get("message", {}).get("call", {})
    vapi_call_id = call_obj.get("id")
    metadata = call_obj.get("metadata", {})
    internal_call_id = metadata.get("call_id")

    # Find the call record
    call = None
    if internal_call_id:
        call = (
            db.query(CallTaskDB)
            .filter(CallTaskDB.id == int(internal_call_id))
            .first()
        )
    if not call and vapi_call_id:
        call = (
            db.query(CallTaskDB)
            .filter(CallTaskDB.vapi_call_id == vapi_call_id)
            .first()
        )

    if not call:
        return {"status": "ignored", "reason": "call not found"}

    # Store vapi_call_id if we don't have it yet
    if not call.vapi_call_id and vapi_call_id:
        call.vapi_call_id = vapi_call_id

    if message_type == "status-update":
        status = body.get("message", {}).get("status", "")
        if status == "in-progress":
            call.status = CallStatus.IN_PROGRESS.value
        elif status == "forwarding":
            call.status = CallStatus.IN_PROGRESS.value
        db.commit()

    elif message_type == "end-of-call-report":
        msg = body.get("message", {})
        call.transcript = msg.get("transcript", "")
        call.ended_reason = msg.get("endedReason", "")

        analysis = msg.get("analysis", {})
        call.ai_summary = analysis.get("summary", "")

        structured = analysis.get("structuredData", {})
        if structured:
            call.booking_confirmed = structured.get("booking_confirmed", False)
        else:
            call.booking_confirmed = False

        call.status = (
            CallStatus.COMPLETED.value
            if call.booking_confirmed
            else CallStatus.FAILED.value
        )
        db.commit()

    return {"status": "ok"}
