"""ORM models for the TradingAgents web console."""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, UniqueConstraint

from web.db import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("username", name="uq_users_username"),)

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class JobHistory(Base):
    __tablename__ = "job_history"
    __table_args__ = (UniqueConstraint("job_id", name="uq_history_job_id"),)

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(64), nullable=False, index=True)
    username = Column(String(64), nullable=False, index=True)
    ticker = Column(String(32), nullable=False)
    analysis_date = Column(String(32), nullable=False)
    status = Column(String(32), nullable=False)
    decision = Column(String(512))
    result_dir = Column(String(256))
    summary_json = Column(String)
    log_path = Column(String(256))
    error = Column(String)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime)
