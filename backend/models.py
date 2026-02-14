from pydantic import BaseModel
from enum import Enum
from typing import Optional


class CallStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class CallTaskCreate(BaseModel):
    phone_number: str
    contact_name: Optional[str] = None
    scheduled_time: int
    status: CallStatus = CallStatus.SCHEDULED


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

    class Config:
        from_attributes = True
