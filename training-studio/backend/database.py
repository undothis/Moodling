"""
Database models and connection for Training Studio.
Uses SQLAlchemy with async SQLite.
"""

import json
from datetime import datetime
from typing import Optional, List, Any
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey,
    create_engine, JSON
)
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from sqlalchemy.pool import StaticPool

from config import settings

# Create async engine
engine = create_async_engine(
    settings.database_url,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
    poolclass=StaticPool if "sqlite" in settings.database_url else None,
)

# Async session factory
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Base class for models
Base = declarative_base()


# ============================================================================
# DATABASE MODELS
# ============================================================================

class ChannelModel(Base):
    """YouTube channel to process."""
    __tablename__ = "channels"

    id = Column(String, primary_key=True)
    channel_id = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    category = Column(String, default="general")
    trust_level = Column(String, default="medium")  # low, medium, high
    extraction_categories = Column(JSON, default=list)
    enabled = Column(Boolean, default=True)
    videos_processed = Column(Integer, default=0)
    insights_extracted = Column(Integer, default=0)
    last_processed = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    videos = relationship("VideoModel", back_populates="channel")


class VideoModel(Base):
    """YouTube video metadata."""
    __tablename__ = "videos"

    id = Column(String, primary_key=True)
    video_id = Column(String, unique=True, nullable=False)
    channel_id = Column(String, ForeignKey("channels.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    duration_seconds = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    published_at = Column(DateTime, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    channel = relationship("ChannelModel", back_populates="videos")
    processing_job = relationship("ProcessingJobModel", back_populates="video", uselist=False)
    insights = relationship("InsightModel", back_populates="video")


class ProcessingJobModel(Base):
    """Video processing job."""
    __tablename__ = "processing_jobs"

    id = Column(String, primary_key=True)
    video_id = Column(String, ForeignKey("videos.id"), unique=True, nullable=False)
    status = Column(String, default="queued")  # queued, downloading, transcribing, etc.
    progress = Column(Float, default=0.0)
    current_step = Column(String, default="")
    error_message = Column(Text, nullable=True)

    # Results (stored as JSON)
    transcript_json = Column(JSON, nullable=True)
    speaker_profiles_json = Column(JSON, nullable=True)
    interview_dynamics_json = Column(JSON, nullable=True)
    interview_statistics_json = Column(JSON, nullable=True)
    interview_type = Column(String, nullable=True)
    therapeutic_approach = Column(String, nullable=True)
    emotional_arc_json = Column(JSON, nullable=True)
    aliveness_scores_json = Column(JSON, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    video = relationship("VideoModel", back_populates="processing_job")


class InsightModel(Base):
    """Extracted insight from a video."""
    __tablename__ = "insights"

    id = Column(String, primary_key=True)
    video_id = Column(String, ForeignKey("videos.id"), nullable=False)
    title = Column(String, nullable=False)
    insight = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    coaching_implication = Column(Text, nullable=False)
    timestamp = Column(String, nullable=True)

    # Scores
    quality_score = Column(Float, default=0.0)
    specificity_score = Column(Float, default=0.0)
    actionability_score = Column(Float, default=0.0)
    safety_score = Column(Float, default=0.0)
    novelty_score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)

    # Prosody context
    prosody_context_json = Column(JSON, nullable=True)

    # Status
    status = Column(String, default="pending")  # pending, approved, rejected
    flagged_for_review = Column(Boolean, default=False)
    review_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    # Relationships
    video = relationship("VideoModel", back_populates="insights")


class TrainingExportModel(Base):
    """Training data export record."""
    __tablename__ = "training_exports"

    id = Column(String, primary_key=True)
    version = Column(String, default="1.0")
    total_examples = Column(Integer, default=0)
    export_path = Column(String, nullable=True)
    statistics_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================================
# DATABASE UTILITIES
# ============================================================================

async def init_db():
    """Initialize the database and create all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncSession:
    """Get a database session."""
    async with async_session() as session:
        yield session


class DatabaseService:
    """Service class for database operations."""

    @staticmethod
    async def get_all_channels() -> List[ChannelModel]:
        """Get all channels."""
        async with async_session() as session:
            from sqlalchemy import select
            result = await session.execute(select(ChannelModel))
            return result.scalars().all()

    @staticmethod
    async def get_channel(channel_id: str) -> Optional[ChannelModel]:
        """Get a channel by ID."""
        async with async_session() as session:
            from sqlalchemy import select
            result = await session.execute(
                select(ChannelModel).where(ChannelModel.id == channel_id)
            )
            return result.scalar_one_or_none()

    @staticmethod
    async def create_channel(channel_data: dict) -> ChannelModel:
        """Create a new channel."""
        async with async_session() as session:
            channel = ChannelModel(**channel_data)
            session.add(channel)
            await session.commit()
            await session.refresh(channel)
            return channel

    @staticmethod
    async def update_channel(channel_id: str, updates: dict) -> Optional[ChannelModel]:
        """Update a channel."""
        async with async_session() as session:
            from sqlalchemy import select
            result = await session.execute(
                select(ChannelModel).where(ChannelModel.id == channel_id)
            )
            channel = result.scalar_one_or_none()
            if channel:
                for key, value in updates.items():
                    setattr(channel, key, value)
                await session.commit()
                await session.refresh(channel)
            return channel

    @staticmethod
    async def get_all_insights(status: Optional[str] = None) -> List[InsightModel]:
        """Get all insights, optionally filtered by status."""
        async with async_session() as session:
            from sqlalchemy import select
            query = select(InsightModel)
            if status:
                query = query.where(InsightModel.status == status)
            result = await session.execute(query.order_by(InsightModel.created_at.desc()))
            return result.scalars().all()

    @staticmethod
    async def get_insight(insight_id: str) -> Optional[InsightModel]:
        """Get an insight by ID."""
        async with async_session() as session:
            from sqlalchemy import select
            result = await session.execute(
                select(InsightModel).where(InsightModel.id == insight_id)
            )
            return result.scalar_one_or_none()

    @staticmethod
    async def create_insight(insight_data: dict) -> InsightModel:
        """Create a new insight."""
        async with async_session() as session:
            insight = InsightModel(**insight_data)
            session.add(insight)
            await session.commit()
            await session.refresh(insight)
            return insight

    @staticmethod
    async def update_insight(insight_id: str, updates: dict) -> Optional[InsightModel]:
        """Update an insight."""
        async with async_session() as session:
            from sqlalchemy import select
            result = await session.execute(
                select(InsightModel).where(InsightModel.id == insight_id)
            )
            insight = result.scalar_one_or_none()
            if insight:
                for key, value in updates.items():
                    setattr(insight, key, value)
                await session.commit()
                await session.refresh(insight)
            return insight

    @staticmethod
    async def get_statistics() -> dict:
        """Get aggregate statistics."""
        async with async_session() as session:
            from sqlalchemy import select, func

            # Video counts
            video_count = await session.execute(
                select(func.count(VideoModel.id))
            )
            total_videos = video_count.scalar() or 0

            # Processing job stats
            job_result = await session.execute(
                select(
                    func.sum(ProcessingJobModel.interview_statistics_json['duration_seconds'].as_float())
                ).where(ProcessingJobModel.status == "completed")
            )
            total_duration = job_result.scalar() or 0

            # Insight counts
            insight_counts = await session.execute(
                select(InsightModel.status, func.count(InsightModel.id))
                .group_by(InsightModel.status)
            )
            status_counts = {row[0]: row[1] for row in insight_counts}

            return {
                "total_videos_processed": total_videos,
                "total_hours_analyzed": total_duration / 3600,
                "total_insights": sum(status_counts.values()),
                "approved_insights": status_counts.get("approved", 0),
                "pending_insights": status_counts.get("pending", 0),
                "rejected_insights": status_counts.get("rejected", 0),
            }


# Export database service
db = DatabaseService()
