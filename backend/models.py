from pydantic import BaseModel
from enum import Enum
from typing import Optional


class CallStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class CallType(str, Enum):
    MANUAL = "MANUAL"
    AI_AGENT = "AI_AGENT"


class CallTaskCreate(BaseModel):
    phone_number: str
    contact_name: Optional[str] = None
    scheduled_time: int
    status: CallStatus = CallStatus.SCHEDULED


class AIAgentCallCreate(BaseModel):
    phone_number: str
    booking_date: str
    booking_time: str
    num_players: int = 2
    player_name: str = "Guest"


class CallTaskUpdate(BaseModel):
    status: Optional[CallStatus] = None
    scheduled_time: Optional[int] = None


class CallTaskResponse(BaseModel):
    id: int
    phone_number: str
    contact_name: Optional[str]
    scheduled_time: int
    status: CallStatus
    created_at: int
    call_type: str = "MANUAL"
    vapi_call_id: Optional[str] = None
    booking_date: Optional[str] = None
    booking_time: Optional[str] = None
    num_players: Optional[int] = None
    player_name: Optional[str] = None
    transcript: Optional[str] = None
    booking_confirmed: Optional[bool] = None
    ai_summary: Optional[str] = None
    ended_reason: Optional[str] = None

    class Config:
        from_attributes = True
