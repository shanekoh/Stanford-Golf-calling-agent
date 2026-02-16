from sqlalchemy import create_engine, Column, Integer, String, Boolean, Text
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./calls.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class CallTaskDB(Base):
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    phone_number = Column(String, nullable=False)
    contact_name = Column(String, nullable=True)
    scheduled_time = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="SCHEDULED")
    created_at = Column(Integer, nullable=False)
    # AI agent fields
    call_type = Column(String, nullable=False, default="MANUAL")
    vapi_call_id = Column(String, nullable=True)
    booking_date = Column(String, nullable=True)
    booking_time = Column(String, nullable=True)
    num_players = Column(Integer, nullable=True)
    player_name = Column(String, nullable=True)
    transcript = Column(Text, nullable=True)
    booking_confirmed = Column(Boolean, nullable=True)
    ai_summary = Column(Text, nullable=True)
    ended_reason = Column(String, nullable=True)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
