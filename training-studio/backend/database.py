"""
Database models and connection for Training Studio.
Uses SQLAlchemy with async SQLite.
"""

import json
import uuid
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

    # Influence/tuning controls
    influence_weight = Column(Float, default=1.0)  # 0.0 to 2.0 - how much this channel affects training
    include_in_training = Column(Boolean, default=True)  # Quick toggle to exclude from exports
    notes = Column(Text, nullable=True)  # Notes about this channel's contribution

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

    # Source tracking for training data provenance
    source_token = Column(String, nullable=True)  # Unique token: {channel_short}_{video_short}_{insight_short}
    channel_id = Column(String, nullable=True)  # Direct channel reference for quick filtering

    # Brain Studio: Identification marker and influence control
    marker = Column(String, nullable=True)  # Unique marker: ML-CH{channel_id}-V{video_id}-I{insight_id}
    influence_weight = Column(Float, default=1.0)  # 0.0 to 2.0 - how much this insight affects training
    is_active = Column(Boolean, default=True)  # Quick toggle to include/exclude from training

    # Scores
    quality_score = Column(Float, default=0.0)
    specificity_score = Column(Float, default=0.0)
    actionability_score = Column(Float, default=0.0)
    safety_score = Column(Float, default=0.0)
    novelty_score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)

    # Prosody context
    prosody_context_json = Column(JSON, nullable=True)

    # Emotional context from facial/voice analysis
    emotional_context_json = Column(JSON, nullable=True)  # {"emotions": ["sad", "anxious"], "intensity": 0.7, ...}

    # ══════════════════════════════════════════════════════════════════════════
    # ALIVENESS EXTRACTION FIELDS
    # ══════════════════════════════════════════════════════════════════════════

    # Texture analysis - HOW humans speak, not just WHAT
    texture_analysis_json = Column(JSON, nullable=True)
    # Example: {"emotional_granularity": "high", "self_protective_type": "hedging", ...}

    # Coach response guidance - how AI should respond
    coach_response_json = Column(JSON, nullable=True)
    # Example: {"what_to_do": "...", "what_to_avoid": "...", "example_response": "..."}

    # Training example - ready-to-use LLM training pair
    training_example_json = Column(JSON, nullable=True)
    # Example: {"user_message": "...", "assistant_response": "...", "system_context": "..."}

    # Raw quote from source
    raw_quote = Column(Text, nullable=True)

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
# BRAIN STUDIO MODELS
# ============================================================================

class PhilosophyModel(Base):
    """Core philosophy and program description storage."""
    __tablename__ = "philosophy"

    id = Column(String, primary_key=True, default="main")  # Single main entry
    program_name = Column(String, default="Mood Leaf")
    program_description = Column(Text, nullable=True)  # What the program does
    core_philosophy = Column(Text, nullable=True)  # Core philosophy document
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class TenantModel(Base):
    """Core tenants/principles that all training data must align with."""
    __tablename__ = "tenants"

    id = Column(String, primary_key=True)
    order_index = Column(Integer, default=0)  # For ordering display
    name = Column(String, nullable=False)  # Short name for the tenant
    description = Column(Text, nullable=False)  # Full tenant description
    category = Column(String, default="general")  # ethics, safety, tone, boundaries, etc.
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class InsightComplianceModel(Base):
    """Stores compliance check results for insights against tenants."""
    __tablename__ = "insight_compliance"

    id = Column(String, primary_key=True)
    insight_id = Column(String, ForeignKey("insights.id"), nullable=False)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    alignment_score = Column(Float, default=0.0)  # 0-100% alignment
    is_compliant = Column(Boolean, default=True)
    violation_reason = Column(Text, nullable=True)  # Why it doesn't align
    checked_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    insight = relationship("InsightModel", backref="compliance_checks")
    tenant = relationship("TenantModel", backref="compliance_checks")


class BrainSnapshotModel(Base):
    """Snapshots of brain state for rollback capability."""
    __tablename__ = "brain_snapshots"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    snapshot_data = Column(JSON, nullable=True)  # Serialized state
    insight_count = Column(Integer, default=0)
    channel_count = Column(Integer, default=0)
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

    @staticmethod
    async def get_insights_by_channel(channel_id: str) -> List[InsightModel]:
        """Get all insights from a specific channel."""
        async with async_session() as session:
            from sqlalchemy import select
            result = await session.execute(
                select(InsightModel)
                .where(InsightModel.channel_id == channel_id)
                .order_by(InsightModel.created_at.desc())
            )
            return result.scalars().all()

    @staticmethod
    async def get_insights_by_video(video_id: str) -> List[InsightModel]:
        """Get all insights from a specific video."""
        async with async_session() as session:
            from sqlalchemy import select
            result = await session.execute(
                select(InsightModel)
                .where(InsightModel.video_id == video_id)
                .order_by(InsightModel.created_at.desc())
            )
            return result.scalars().all()

    @staticmethod
    async def delete_insights_by_channel(channel_id: str) -> int:
        """Delete all insights from a specific channel. Returns count deleted."""
        async with async_session() as session:
            from sqlalchemy import delete, select, func

            # Count first
            count_result = await session.execute(
                select(func.count(InsightModel.id))
                .where(InsightModel.channel_id == channel_id)
            )
            count = count_result.scalar() or 0

            # Delete
            await session.execute(
                delete(InsightModel).where(InsightModel.channel_id == channel_id)
            )
            await session.commit()
            return count

    @staticmethod
    async def delete_insights_by_video(video_id: str) -> int:
        """Delete all insights from a specific video. Returns count deleted."""
        async with async_session() as session:
            from sqlalchemy import delete, select, func

            # Count first
            count_result = await session.execute(
                select(func.count(InsightModel.id))
                .where(InsightModel.video_id == video_id)
            )
            count = count_result.scalar() or 0

            # Delete
            await session.execute(
                delete(InsightModel).where(InsightModel.video_id == video_id)
            )
            await session.commit()
            return count

    @staticmethod
    async def get_channel_statistics() -> List[dict]:
        """Get detailed statistics for each channel."""
        async with async_session() as session:
            from sqlalchemy import select, func

            channels = await session.execute(select(ChannelModel))
            channel_list = channels.scalars().all()

            stats = []
            for channel in channel_list:
                # Get insight counts and averages for this channel
                insight_stats = await session.execute(
                    select(
                        func.count(InsightModel.id).label('total'),
                        func.avg(InsightModel.quality_score).label('avg_quality'),
                        func.avg(InsightModel.safety_score).label('avg_safety'),
                        func.avg(InsightModel.confidence).label('avg_confidence'),
                    ).where(InsightModel.channel_id == channel.id)
                )
                row = insight_stats.fetchone()

                # Get status breakdown
                status_counts = await session.execute(
                    select(InsightModel.status, func.count(InsightModel.id))
                    .where(InsightModel.channel_id == channel.id)
                    .group_by(InsightModel.status)
                )
                status_dict = {s[0]: s[1] for s in status_counts}

                # Get category breakdown
                category_counts = await session.execute(
                    select(InsightModel.category, func.count(InsightModel.id))
                    .where(InsightModel.channel_id == channel.id)
                    .group_by(InsightModel.category)
                )
                category_dict = {c[0]: c[1] for c in category_counts}

                stats.append({
                    "channel_id": channel.id,
                    "channel_name": channel.name,
                    "channel_url": channel.url,
                    "influence_weight": channel.influence_weight,
                    "include_in_training": channel.include_in_training,
                    "trust_level": channel.trust_level,
                    "total_insights": row.total if row else 0,
                    "approved_insights": status_dict.get("approved", 0),
                    "pending_insights": status_dict.get("pending", 0),
                    "rejected_insights": status_dict.get("rejected", 0),
                    "avg_quality": round(row.avg_quality, 1) if row and row.avg_quality else 0,
                    "avg_safety": round(row.avg_safety, 1) if row and row.avg_safety else 0,
                    "avg_confidence": round(row.avg_confidence * 100, 1) if row and row.avg_confidence else 0,
                    "category_distribution": category_dict,
                    "videos_processed": channel.videos_processed,
                })

            return stats

    @staticmethod
    async def get_video_statistics() -> List[dict]:
        """Get statistics for each processed video."""
        async with async_session() as session:
            from sqlalchemy import select, func

            # Get unique video IDs with insights
            video_ids = await session.execute(
                select(InsightModel.video_id).distinct()
            )

            stats = []
            for (video_id,) in video_ids:
                insight_stats = await session.execute(
                    select(
                        func.count(InsightModel.id).label('total'),
                        func.avg(InsightModel.quality_score).label('avg_quality'),
                        func.avg(InsightModel.safety_score).label('avg_safety'),
                        InsightModel.channel_id,
                    ).where(InsightModel.video_id == video_id)
                    .group_by(InsightModel.channel_id)
                )
                row = insight_stats.fetchone()

                if row:
                    stats.append({
                        "video_id": video_id,
                        "channel_id": row.channel_id,
                        "total_insights": row.total,
                        "avg_quality": round(row.avg_quality, 1) if row.avg_quality else 0,
                        "avg_safety": round(row.avg_safety, 1) if row.avg_safety else 0,
                    })

            return stats

    # ========================================================================
    # BRAIN STUDIO DATABASE METHODS
    # ========================================================================

    @staticmethod
    async def get_philosophy() -> Optional[PhilosophyModel]:
        """Get the main philosophy document."""
        async with async_session() as session:
            from sqlalchemy import select
            result = await session.execute(
                select(PhilosophyModel).where(PhilosophyModel.id == "main")
            )
            return result.scalar_one_or_none()

    @staticmethod
    async def upsert_philosophy(data: dict) -> PhilosophyModel:
        """Create or update the philosophy document."""
        async with async_session() as session:
            from sqlalchemy import select
            result = await session.execute(
                select(PhilosophyModel).where(PhilosophyModel.id == "main")
            )
            philosophy = result.scalar_one_or_none()

            if philosophy:
                for key, value in data.items():
                    if hasattr(philosophy, key):
                        setattr(philosophy, key, value)
                philosophy.updated_at = datetime.utcnow()
            else:
                philosophy = PhilosophyModel(id="main", **data)
                session.add(philosophy)

            await session.commit()
            await session.refresh(philosophy)
            return philosophy

    @staticmethod
    async def get_all_tenants() -> List[TenantModel]:
        """Get all tenants ordered by order_index."""
        async with async_session() as session:
            from sqlalchemy import select
            result = await session.execute(
                select(TenantModel).order_by(TenantModel.order_index)
            )
            return result.scalars().all()

    @staticmethod
    async def get_active_tenants() -> List[TenantModel]:
        """Get all active tenants."""
        async with async_session() as session:
            from sqlalchemy import select
            result = await session.execute(
                select(TenantModel)
                .where(TenantModel.is_active == True)
                .order_by(TenantModel.order_index)
            )
            return result.scalars().all()

    @staticmethod
    async def create_tenant(tenant_data: dict) -> TenantModel:
        """Create a new tenant."""
        async with async_session() as session:
            from sqlalchemy import select, func

            # Get next order index
            result = await session.execute(
                select(func.max(TenantModel.order_index))
            )
            max_order = result.scalar() or 0

            tenant = TenantModel(
                id=str(uuid.uuid4())[:8],
                order_index=max_order + 1,
                **tenant_data
            )
            session.add(tenant)
            await session.commit()
            await session.refresh(tenant)
            return tenant

    @staticmethod
    async def update_tenant(tenant_id: str, updates: dict) -> Optional[TenantModel]:
        """Update a tenant."""
        async with async_session() as session:
            from sqlalchemy import select
            result = await session.execute(
                select(TenantModel).where(TenantModel.id == tenant_id)
            )
            tenant = result.scalar_one_or_none()
            if tenant:
                for key, value in updates.items():
                    if hasattr(tenant, key):
                        setattr(tenant, key, value)
                tenant.updated_at = datetime.utcnow()
                await session.commit()
                await session.refresh(tenant)
            return tenant

    @staticmethod
    async def delete_tenant(tenant_id: str) -> bool:
        """Delete a tenant."""
        async with async_session() as session:
            from sqlalchemy import delete
            result = await session.execute(
                delete(TenantModel).where(TenantModel.id == tenant_id)
            )
            await session.commit()
            return result.rowcount > 0

    @staticmethod
    async def bulk_create_tenants(tenants: List[dict]) -> List[TenantModel]:
        """Create multiple tenants at once (for file upload)."""
        async with async_session() as session:
            from sqlalchemy import select, func

            # Get current max order
            result = await session.execute(
                select(func.max(TenantModel.order_index))
            )
            max_order = result.scalar() or 0

            created = []
            for i, tenant_data in enumerate(tenants):
                tenant = TenantModel(
                    id=str(uuid.uuid4())[:8],
                    order_index=max_order + i + 1,
                    name=tenant_data.get("name", f"Tenant {max_order + i + 1}"),
                    description=tenant_data.get("description", ""),
                    category=tenant_data.get("category", "general"),
                    is_active=True
                )
                session.add(tenant)
                created.append(tenant)

            await session.commit()
            for t in created:
                await session.refresh(t)
            return created

    @staticmethod
    async def generate_insight_marker(channel_id: str, video_id: str, insight_id: str) -> str:
        """Generate a unique marker for an insight."""
        # Format: ML-CH{first 4 of channel}-V{first 4 of video}-I{first 4 of insight}
        ch_short = channel_id[:4] if channel_id else "0000"
        vid_short = video_id[:4] if video_id else "0000"
        ins_short = insight_id[:4] if insight_id else "0000"
        return f"ML-CH{ch_short}-V{vid_short}-I{ins_short}"

    @staticmethod
    async def update_insight_weight(insight_id: str, weight: float, is_active: bool = True) -> Optional[InsightModel]:
        """Update an insight's influence weight."""
        async with async_session() as session:
            from sqlalchemy import select
            result = await session.execute(
                select(InsightModel).where(InsightModel.id == insight_id)
            )
            insight = result.scalar_one_or_none()
            if insight:
                insight.influence_weight = max(0.0, min(2.0, weight))  # Clamp to 0-2
                insight.is_active = is_active
                await session.commit()
                await session.refresh(insight)
            return insight

    @staticmethod
    async def get_insights_with_markers() -> List[InsightModel]:
        """Get all insights with their markers for Brain Studio."""
        async with async_session() as session:
            from sqlalchemy import select
            result = await session.execute(
                select(InsightModel)
                .where(InsightModel.status == "approved")
                .order_by(InsightModel.created_at.desc())
            )
            return result.scalars().all()

    @staticmethod
    async def save_compliance_result(
        insight_id: str,
        tenant_id: str,
        alignment_score: float,
        is_compliant: bool,
        violation_reason: Optional[str] = None
    ) -> InsightComplianceModel:
        """Save a compliance check result."""
        async with async_session() as session:
            from sqlalchemy import select, delete

            # Remove any existing check for this insight/tenant pair
            await session.execute(
                delete(InsightComplianceModel).where(
                    InsightComplianceModel.insight_id == insight_id,
                    InsightComplianceModel.tenant_id == tenant_id
                )
            )

            compliance = InsightComplianceModel(
                id=str(uuid.uuid4())[:8],
                insight_id=insight_id,
                tenant_id=tenant_id,
                alignment_score=alignment_score,
                is_compliant=is_compliant,
                violation_reason=violation_reason,
                checked_at=datetime.utcnow()
            )
            session.add(compliance)
            await session.commit()
            await session.refresh(compliance)
            return compliance

    @staticmethod
    async def get_non_compliant_insights() -> List[dict]:
        """Get all insights that have compliance violations."""
        async with async_session() as session:
            from sqlalchemy import select
            result = await session.execute(
                select(InsightComplianceModel)
                .where(InsightComplianceModel.is_compliant == False)
                .order_by(InsightComplianceModel.alignment_score)
            )
            violations = result.scalars().all()

            # Build response with insight and tenant details
            response = []
            for v in violations:
                insight = await session.execute(
                    select(InsightModel).where(InsightModel.id == v.insight_id)
                )
                insight_obj = insight.scalar_one_or_none()

                tenant = await session.execute(
                    select(TenantModel).where(TenantModel.id == v.tenant_id)
                )
                tenant_obj = tenant.scalar_one_or_none()

                if insight_obj and tenant_obj:
                    response.append({
                        "compliance_id": v.id,
                        "insight_id": v.insight_id,
                        "insight_marker": insight_obj.marker,
                        "insight_text": insight_obj.insight,
                        "insight_category": insight_obj.category,
                        "tenant_id": v.tenant_id,
                        "tenant_name": tenant_obj.name,
                        "tenant_description": tenant_obj.description,
                        "alignment_score": v.alignment_score,
                        "violation_reason": v.violation_reason,
                        "influence_weight": insight_obj.influence_weight,
                        "is_active": insight_obj.is_active,
                    })

            return response

    @staticmethod
    async def clear_compliance_results() -> int:
        """Clear all compliance results (before re-running check)."""
        async with async_session() as session:
            from sqlalchemy import delete, select, func
            count = await session.execute(select(func.count(InsightComplianceModel.id)))
            count_val = count.scalar() or 0
            await session.execute(delete(InsightComplianceModel))
            await session.commit()
            return count_val

    @staticmethod
    async def get_brain_statistics() -> dict:
        """Get overall brain statistics for the studio."""
        async with async_session() as session:
            from sqlalchemy import select, func

            # Total insights
            total = await session.execute(select(func.count(InsightModel.id)))
            total_insights = total.scalar() or 0

            # Active insights
            active = await session.execute(
                select(func.count(InsightModel.id))
                .where(InsightModel.is_active == True, InsightModel.status == "approved")
            )
            active_insights = active.scalar() or 0

            # Total channels
            channels = await session.execute(select(func.count(ChannelModel.id)))
            total_channels = channels.scalar() or 0

            # Tenants
            tenants = await session.execute(select(func.count(TenantModel.id)))
            total_tenants = tenants.scalar() or 0

            # Non-compliant
            violations = await session.execute(
                select(func.count(InsightComplianceModel.id))
                .where(InsightComplianceModel.is_compliant == False)
            )
            total_violations = violations.scalar() or 0

            # Average weight
            avg_weight = await session.execute(
                select(func.avg(InsightModel.influence_weight))
                .where(InsightModel.status == "approved")
            )
            average_weight = avg_weight.scalar() or 1.0

            return {
                "total_insights": total_insights,
                "active_insights": active_insights,
                "total_channels": total_channels,
                "total_tenants": total_tenants,
                "total_violations": total_violations,
                "average_weight": round(average_weight, 2),
            }


# Export database service
db = DatabaseService()
