import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db, CallTaskDB
from models import CallTaskCreate, CallTaskUpdate, CallTaskResponse

router = APIRouter(prefix="/calls", tags=["calls"])


@router.get("/", response_model=List[CallTaskResponse])
def list_calls(db: Session = Depends(get_db)):
    return db.query(CallTaskDB).order_by(CallTaskDB.scheduled_time.desc()).all()


@router.get("/{call_id}", response_model=CallTaskResponse)
def get_call(call_id: int, db: Session = Depends(get_db)):
    call = db.query(CallTaskDB).filter(CallTaskDB.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call


@router.post("/", response_model=CallTaskResponse, status_code=201)
def create_call(call: CallTaskCreate, db: Session = Depends(get_db)):
    db_call = CallTaskDB(
        phone_number=call.phone_number,
        contact_name=call.contact_name,
        scheduled_time=call.scheduled_time,
        status=call.status.value,
        created_at=int(time.time() * 1000),
    )
    db.add(db_call)
    db.commit()
    db.refresh(db_call)
    return db_call


@router.patch("/{call_id}", response_model=CallTaskResponse)
def update_call(call_id: int, update: CallTaskUpdate, db: Session = Depends(get_db)):
    call = db.query(CallTaskDB).filter(CallTaskDB.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    if update.status is not None:
        call.status = update.status.value
    if update.scheduled_time is not None:
        call.scheduled_time = update.scheduled_time
    db.commit()
    db.refresh(call)
    return call


@router.delete("/{call_id}", status_code=204)
def delete_call(call_id: int, db: Session = Depends(get_db)):
    call = db.query(CallTaskDB).filter(CallTaskDB.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    db.delete(call)
    db.commit()
