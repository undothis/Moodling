"""
Training Studio - FastAPI Backend

Main application that provides REST API for:
- Channel management
- Video processing (download, transcribe, analyze)
- Insight extraction and review
- Training data export
"""

import asyncio
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import settings, init_directories, EXTRACTION_CATEGORIES, RECOMMENDED_CHANNELS
from database import init_db, db, async_session, ChannelModel, VideoModel, ProcessingJobModel, InsightModel
from models import (
    YouTubeChannel, VideoMetadata, ProcessingJob, ProcessingStatus,
    ExtractedInsight, InsightStatus,
    ChannelCreateRequest, ProcessVideoRequest, BatchProcessRequest,
    InsightReviewRequest, StatisticsResponse, HealthResponse,
    TranscriptResult, TranscriptSegment, TrainingDataExport, TrainingExample
)
from youtube import youtube_service
from transcription import transcription_service
from diarization import diarization_service
from prosody import prosody_service
from facial import facial_service
from insights import insight_service


# ============================================================================
# APP INITIALIZATION
# ============================================================================

app = FastAPI(
    title="Training Studio",
    description="Backend for MoodLeaf AI training data harvesting",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    """Initialize application on startup."""
    init_directories()
    await init_db()
    print("Training Studio backend started")


# ============================================================================
# HEALTH & INFO ENDPOINTS
# ============================================================================

@app.get("/", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        version="1.0.0",
        services={
            "database": True,
            "whisper": True,
            "pyannote": bool(settings.huggingface_token),
            "claude": bool(settings.anthropic_api_key),
        }
    )


@app.get("/diagnostics")
async def run_diagnostics():
    """
    Run diagnostic tests on all pipeline components.
    Returns status and any error messages for each component.
    """
    results = {}

    # 1. Test yt-dlp
    try:
        result = await asyncio.create_subprocess_exec(
            "yt-dlp", "--version",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await result.communicate()
        if result.returncode == 0:
            results["yt_dlp"] = {
                "status": "ok",
                "version": stdout.decode().strip(),
                "message": "YouTube downloader ready"
            }
        else:
            results["yt_dlp"] = {
                "status": "error",
                "message": f"yt-dlp error: {stderr.decode()}"
            }
    except FileNotFoundError:
        results["yt_dlp"] = {
            "status": "error",
            "message": "yt-dlp not installed. Run: brew install yt-dlp"
        }
    except Exception as e:
        results["yt_dlp"] = {"status": "error", "message": str(e)}

    # 2. Test ffmpeg
    try:
        result = await asyncio.create_subprocess_exec(
            "ffmpeg", "-version",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await result.communicate()
        if result.returncode == 0:
            version_line = stdout.decode().split('\n')[0]
            results["ffmpeg"] = {
                "status": "ok",
                "version": version_line,
                "message": "Audio processing ready"
            }
        else:
            results["ffmpeg"] = {"status": "error", "message": "ffmpeg failed"}
    except FileNotFoundError:
        results["ffmpeg"] = {
            "status": "error",
            "message": "ffmpeg not installed. Run: brew install ffmpeg"
        }
    except Exception as e:
        results["ffmpeg"] = {"status": "error", "message": str(e)}

    # 3. Test Whisper
    try:
        import whisper
        results["whisper"] = {
            "status": "ok",
            "message": "Whisper transcription available",
            "note": "Model loads on first use"
        }
    except ImportError:
        results["whisper"] = {
            "status": "error",
            "message": "Whisper not installed. Run: pip install openai-whisper"
        }
    except Exception as e:
        results["whisper"] = {"status": "error", "message": str(e)}

    # 4. Test pyannote (diarization)
    try:
        if settings.huggingface_token:
            from pyannote.audio import Pipeline
            results["pyannote"] = {
                "status": "ok",
                "message": "Speaker diarization available",
                "note": "HuggingFace token configured"
            }
        else:
            results["pyannote"] = {
                "status": "warning",
                "message": "No HuggingFace token - diarization disabled",
                "note": "Set HUGGINGFACE_TOKEN in .env for speaker detection"
            }
    except ImportError:
        results["pyannote"] = {
            "status": "error",
            "message": "pyannote.audio not installed"
        }
    except Exception as e:
        results["pyannote"] = {"status": "error", "message": str(e)}

    # 5. Test prosody (librosa)
    try:
        import librosa
        import numpy as np
        results["prosody_librosa"] = {
            "status": "ok",
            "version": librosa.__version__,
            "message": "Audio analysis ready"
        }
    except ImportError:
        results["prosody_librosa"] = {
            "status": "error",
            "message": "librosa not installed. Run: pip install librosa"
        }
    except Exception as e:
        results["prosody_librosa"] = {"status": "error", "message": str(e)}

    # 6. Test parselmouth (Praat)
    try:
        import parselmouth
        results["prosody_praat"] = {
            "status": "ok",
            "message": "Voice quality analysis ready (Praat)"
        }
    except ImportError:
        results["prosody_praat"] = {
            "status": "warning",
            "message": "parselmouth not installed - some voice analysis disabled",
            "note": "Run: pip install praat-parselmouth"
        }
    except Exception as e:
        results["prosody_praat"] = {"status": "error", "message": str(e)}

    # 7. Test facial analysis (py-feat)
    try:
        from feat import Detector
        results["facial_pyfeat"] = {
            "status": "ok",
            "message": "Facial expression analysis ready"
        }
    except ImportError:
        results["facial_pyfeat"] = {
            "status": "warning",
            "message": "py-feat not installed - facial analysis disabled",
            "note": "Run: pip install py-feat"
        }
    except Exception as e:
        results["facial_pyfeat"] = {"status": "error", "message": str(e)}

    # 8. Test MediaPipe (backup facial)
    try:
        import mediapipe
        results["facial_mediapipe"] = {
            "status": "ok",
            "message": "MediaPipe face mesh available (backup)"
        }
    except ImportError:
        results["facial_mediapipe"] = {
            "status": "warning",
            "message": "MediaPipe not installed",
            "note": "Run: pip install mediapipe"
        }
    except Exception as e:
        results["facial_mediapipe"] = {"status": "error", "message": str(e)}

    # 9. Test Claude API
    try:
        if settings.anthropic_api_key:
            import anthropic
            client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
            # Just check if we can create a client
            results["claude"] = {
                "status": "ok",
                "message": "Claude API configured",
                "key_preview": f"...{settings.anthropic_api_key[-4:]}"
            }
        else:
            results["claude"] = {
                "status": "error",
                "message": "No API key configured",
                "note": "Set ANTHROPIC_API_KEY in .env or use the UI"
            }
    except ImportError:
        results["claude"] = {
            "status": "error",
            "message": "anthropic package not installed. Run: pip install anthropic"
        }
    except Exception as e:
        results["claude"] = {"status": "error", "message": str(e)}

    # Summary
    ok_count = sum(1 for r in results.values() if r["status"] == "ok")
    warning_count = sum(1 for r in results.values() if r["status"] == "warning")
    error_count = sum(1 for r in results.values() if r["status"] == "error")

    return {
        "summary": {
            "ok": ok_count,
            "warnings": warning_count,
            "errors": error_count,
            "ready_for_simple_mode": results.get("yt_dlp", {}).get("status") == "ok" and results.get("claude", {}).get("status") == "ok",
            "ready_for_full_mode": error_count == 0
        },
        "components": results
    }


@app.get("/categories")
async def get_categories():
    """Get available extraction categories."""
    return EXTRACTION_CATEGORIES


@app.get("/recommended-channels")
async def get_recommended_channels():
    """Get list of recommended YouTube channels."""
    return RECOMMENDED_CHANNELS


# ============================================================================
# CHANNEL MANAGEMENT
# ============================================================================

@app.get("/channels")
async def list_channels():
    """List all configured channels."""
    channels = await db.get_all_channels()
    return [
        {
            "id": c.id,
            "channel_id": c.channel_id,
            "name": c.name,
            "url": c.url,
            "category": c.category,
            "trust_level": c.trust_level,
            "enabled": c.enabled,
            "videos_processed": c.videos_processed,
            "insights_extracted": c.insights_extracted,
            "last_processed": c.last_processed,
        }
        for c in channels
    ]


@app.post("/channels")
async def add_channel(request: ChannelCreateRequest):
    """Add a new YouTube channel."""
    try:
        # Get channel info from YouTube
        info = await youtube_service.get_channel_info(request.url)

        channel_data = {
            "id": str(uuid.uuid4()),
            "channel_id": info.get("channel_id", str(uuid.uuid4())[:8]),
            "name": info.get("channel_name", "Unknown"),
            "url": info.get("channel_url", request.url),
            "category": request.category,
            "trust_level": request.trust_level,
            "extraction_categories": request.extraction_categories,
            "enabled": True,
            "videos_processed": 0,
            "insights_extracted": 0,
        }

        channel = await db.create_channel(channel_data)

        return {
            "success": True,
            "channel": channel_data
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/channels/{channel_id}")
async def delete_channel(channel_id: str):
    """Delete a channel."""
    # Note: In production, would soft-delete or handle cascade properly
    async with async_session() as session:
        from sqlalchemy import delete
        await session.execute(delete(ChannelModel).where(ChannelModel.id == channel_id))
        await session.commit()
    return {"success": True}


@app.get("/channels/{channel_id}/videos")
async def get_channel_videos(
    channel_id: str,
    max_videos: int = Query(default=20, le=50),
    strategy: str = Query(default="balanced")
):
    """Fetch videos from a channel for processing."""
    channel = await db.get_channel(channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    videos = await youtube_service.fetch_channel_videos(
        channel.url,
        max_videos=max_videos,
        strategy=strategy
    )

    return {
        "channel_id": channel_id,
        "videos": [v.model_dump() for v in videos]
    }


# ============================================================================
# VIDEO PROCESSING
# ============================================================================

# Track active processing jobs
active_jobs: dict = {}


@app.post("/process")
async def process_video(request: ProcessVideoRequest, background_tasks: BackgroundTasks):
    """
    Start processing a single video.
    Returns immediately with job ID, processing happens in background.
    """
    # Extract video ID from URL
    video_url = request.video_url
    video_id = None

    if "youtube.com/watch?v=" in video_url:
        video_id = video_url.split("v=")[1].split("&")[0]
    elif "youtu.be/" in video_url:
        video_id = video_url.split("youtu.be/")[1].split("?")[0]

    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    # Get video info
    video_info = await youtube_service.get_video_info(video_id)
    if not video_info:
        raise HTTPException(status_code=404, detail="Video not found")

    # Create processing job
    job_id = str(uuid.uuid4())
    job = ProcessingJob(
        id=job_id,
        video_id=video_id,
        channel_id=video_info.channel_id or "unknown",
        status=ProcessingStatus.QUEUED,
        progress=0,
        current_step="Queued",
        created_at=datetime.utcnow()
    )

    active_jobs[job_id] = job

    # Start background processing
    background_tasks.add_task(
        process_video_task,
        job_id,
        video_id,
        video_info,
        skip_facial=request.skip_facial,
        skip_prosody=request.skip_prosody
    )

    return {
        "job_id": job_id,
        "video_id": video_id,
        "status": "queued"
    }


@app.get("/process/{job_id}")
async def get_job_status(job_id: str):
    """Get status of a processing job."""
    if job_id not in active_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = active_jobs[job_id]
    return {
        "job_id": job_id,
        "video_id": job.video_id,
        "status": job.status.value,
        "progress": job.progress,
        "current_step": job.current_step,
        "error_message": job.error_message,
        "insights_count": len(job.insights),
        "completed_at": job.completed_at,
    }


@app.get("/jobs")
async def list_jobs():
    """List all processing jobs."""
    return [
        {
            "job_id": job_id,
            "video_id": job.video_id,
            "status": job.status.value,
            "progress": job.progress,
            "current_step": job.current_step,
            "created_at": job.created_at,
            "completed_at": job.completed_at,
        }
        for job_id, job in active_jobs.items()
    ]


async def process_video_task(
    job_id: str,
    video_id: str,
    video_info: VideoMetadata,
    skip_facial: bool = False,
    skip_prosody: bool = False
):
    """Background task for video processing."""
    job = active_jobs[job_id]

    try:
        # Step 1: Download video/audio
        job.status = ProcessingStatus.DOWNLOADING
        job.current_step = "Downloading video..."
        job.progress = 5
        job.started_at = datetime.utcnow()

        downloads = await youtube_service.download_video(
            video_id,
            download_video=not skip_facial,
            download_audio=True
        )

        if not downloads.get("audio_path"):
            raise Exception("Failed to download audio")

        audio_path = downloads["audio_path"]
        video_path = downloads.get("video_path")

        # Step 2: Transcription
        job.status = ProcessingStatus.TRANSCRIBING
        job.current_step = "Transcribing audio..."
        job.progress = 20

        # Try Whisper, fall back to YouTube transcript
        try:
            transcript = await transcription_service.transcribe(audio_path)
        except Exception as e:
            print(f"[Process] Whisper failed: {e}, trying YouTube transcript")
            yt_transcript = await youtube_service.download_transcript(video_id)
            if yt_transcript:
                transcript = await transcription_service.transcribe_with_fallback(
                    audio_path, yt_transcript
                )
            else:
                raise Exception("No transcript available")

        job.transcript = transcript

        # Step 3: Speaker diarization
        job.status = ProcessingStatus.DIARIZING
        job.current_step = "Identifying speakers..."
        job.progress = 40

        diarization = await diarization_service.diarize(audio_path)
        if diarization:
            transcript = diarization_service.merge_transcript_with_diarization(
                transcript, diarization
            )
            speaker_stats = diarization_service.calculate_speaker_statistics(diarization)
            job.speaker_profiles = list(speaker_stats.values())

        # Step 4: Prosody extraction
        if not skip_prosody:
            job.status = ProcessingStatus.EXTRACTING_PROSODY
            job.current_step = "Analyzing voice patterns..."
            job.progress = 55

            prosody = await prosody_service.extract_prosody(audio_path)
            distress = await prosody_service.detect_distress_markers(audio_path)

            # Calculate aliveness scores
            job.aliveness_scores = {
                "aliveness": prosody.aliveness_score,
                "naturalness": prosody.naturalness_score,
                "expressiveness": prosody.emotional_expressiveness,
                "engagement": prosody.engagement_score,
                "distress_level": distress.overall_distress_level * 100
            }
        else:
            prosody = None

        # Step 5: Facial analysis (optional)
        facial_features = None
        if not skip_facial and video_path:
            job.status = ProcessingStatus.ANALYZING_FACIAL
            job.current_step = "Analyzing facial expressions..."
            job.progress = 70

            try:
                frame_results = await facial_service.analyze_video(
                    video_path,
                    sample_rate=5  # Every 5th frame
                )
                if frame_results:
                    facial_features = await facial_service.aggregate_analysis(frame_results)
            except Exception as e:
                print(f"[Process] Facial analysis failed: {e}")

        # Step 6: Interview classification
        job.current_step = "Classifying interview type..."
        job.progress = 80

        classification = await insight_service.classify_interview(transcript)
        job.interview_type = classification.get("interview_type")
        job.therapeutic_approach = classification.get("therapeutic_approach")

        # Step 7: Insight extraction
        job.status = ProcessingStatus.EXTRACTING_INSIGHTS
        job.current_step = "Extracting insights..."
        job.progress = 85

        insights = await insight_service.extract_insights(
            transcript=transcript,
            video_title=video_info.title,
            channel_name=video_info.channel_id or "Unknown",
            prosody=prosody
        )

        # Set video ID on insights
        for insight in insights:
            insight.video_id = video_id

        job.insights = insights

        # Step 8: Save to database
        job.current_step = "Saving results..."
        job.progress = 95

        # Save insights to database
        for insight in insights:
            await db.create_insight({
                "id": insight.id,
                "video_id": insight.video_id,
                "title": insight.title,
                "insight": insight.insight,
                "category": insight.category.value,
                "coaching_implication": insight.coaching_implication,
                "timestamp": insight.timestamp,
                "quality_score": insight.quality_score,
                "specificity_score": insight.specificity_score,
                "actionability_score": insight.actionability_score,
                "safety_score": insight.safety_score,
                "novelty_score": insight.novelty_score,
                "confidence": insight.confidence,
                "status": insight.status.value,
                "flagged_for_review": insight.flagged_for_review,
            })

        # Calculate statistics
        job.interview_statistics = {
            "duration_seconds": transcript.duration,
            "word_count": len(transcript.text.split()),
            "speaker_count": len(job.speaker_profiles) if job.speaker_profiles else 1,
        }

        # Cleanup temp files
        youtube_service.cleanup_temp_files(video_id)

        # Done!
        job.status = ProcessingStatus.COMPLETED
        job.current_step = "Complete"
        job.progress = 100
        job.completed_at = datetime.utcnow()

        print(f"[Process] Completed: {video_id} - {len(insights)} insights extracted")

    except Exception as e:
        job.status = ProcessingStatus.FAILED
        job.error_message = str(e)
        job.current_step = f"Failed: {str(e)[:100]}"
        print(f"[Process] Failed: {video_id} - {e}")

        # Cleanup on failure
        youtube_service.cleanup_temp_files(video_id)


# ============================================================================
# INSIGHTS MANAGEMENT
# ============================================================================

@app.get("/insights")
async def list_insights(
    status: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    limit: int = Query(default=50, le=200)
):
    """List insights with optional filtering."""
    insights = await db.get_all_insights(status=status)

    # Filter by category if specified
    if category:
        insights = [i for i in insights if i.category == category]

    # Limit results
    insights = insights[:limit]

    return [
        {
            "id": i.id,
            "video_id": i.video_id,
            "title": i.title,
            "insight": i.insight,
            "category": i.category,
            "coaching_implication": i.coaching_implication,
            "quality_score": i.quality_score,
            "specificity_score": i.specificity_score,
            "actionability_score": i.actionability_score,
            "safety_score": i.safety_score,
            "novelty_score": i.novelty_score,
            "confidence": i.confidence,
            "status": i.status,
            "flagged_for_review": i.flagged_for_review,
            "created_at": i.created_at,
        }
        for i in insights
    ]


@app.post("/insights/{insight_id}/review")
async def review_insight(insight_id: str, request: InsightReviewRequest):
    """Approve or reject an insight."""
    insight = await db.get_insight(insight_id)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")

    updates = {
        "status": request.action,
        "review_notes": request.notes,
        "reviewed_at": datetime.utcnow(),
    }

    await db.update_insight(insight_id, updates)

    return {"success": True, "status": request.action}


@app.delete("/insights/{insight_id}")
async def delete_insight(insight_id: str):
    """Delete an insight."""
    async with async_session() as session:
        from sqlalchemy import delete
        await session.execute(delete(InsightModel).where(InsightModel.id == insight_id))
        await session.commit()
    return {"success": True}


class BatchApproveRequest(BaseModel):
    """Request for batch approval."""
    min_quality: int = 85


@app.post("/insights/batch-approve")
async def batch_approve_insights(request: BatchApproveRequest):
    """Approve all pending insights with quality score >= threshold."""
    insights = await db.get_all_insights(status="pending")

    approved_count = 0
    for insight in insights:
        if insight.quality_score >= request.min_quality:
            await db.update_insight(insight.id, {
                "status": "approved",
                "review_notes": f"Auto-approved (quality >= {request.min_quality})",
                "reviewed_at": datetime.utcnow(),
            })
            approved_count += 1

    return {
        "success": True,
        "approved_count": approved_count,
        "total_pending": len(insights)
    }


# ============================================================================
# API KEY CONFIGURATION
# ============================================================================

class ApiKeyRequest(BaseModel):
    """Request to set API key."""
    api_key: str


@app.post("/config/api-key")
async def set_api_key(request: ApiKeyRequest):
    """Set the Anthropic API key (stored in memory, not persisted)."""
    if not request.api_key.startswith("sk-ant-"):
        raise HTTPException(status_code=400, detail="Invalid API key format")

    # Update the settings in memory
    settings.anthropic_api_key = request.api_key

    # Reinitialize the insight service with new key
    insight_service.client = None  # Will be recreated on next use

    return {"success": True, "message": "API key updated"}


@app.get("/config/api-key-status")
async def get_api_key_status():
    """Check if API key is configured."""
    has_key = bool(settings.anthropic_api_key)
    # Show only last 4 chars for security
    masked = f"...{settings.anthropic_api_key[-4:]}" if has_key else None
    return {
        "configured": has_key,
        "masked_key": masked
    }


# ============================================================================
# STATISTICS & EXPORT
# ============================================================================

@app.get("/statistics", response_model=StatisticsResponse)
async def get_statistics():
    """Get aggregate statistics."""
    stats = await db.get_statistics()

    # Get category distribution
    insights = await db.get_all_insights()
    category_dist = {}
    for i in insights:
        cat = i.category
        category_dist[cat] = category_dist.get(cat, 0) + 1

    return StatisticsResponse(
        total_videos_processed=stats["total_videos_processed"],
        total_hours_analyzed=stats["total_hours_analyzed"],
        total_insights=stats["total_insights"],
        approved_insights=stats["approved_insights"],
        pending_insights=stats["pending_insights"],
        rejected_insights=stats["rejected_insights"],
        category_distribution=category_dist,
    )


@app.get("/export")
async def export_training_data(
    format: str = Query(default="alpaca"),
    status: str = Query(default="approved")
):
    """
    Export training data in various formats.

    Formats:
    - alpaca: Alpaca/ShareGPT format for fine-tuning
    - jsonl: JSON Lines format
    - raw: Raw insight data
    """
    insights = await db.get_all_insights(status=status)

    if format == "alpaca":
        # Alpaca format for Llama fine-tuning
        examples = []
        for i in insights:
            example = {
                "instruction": f"As a wellness coach, how should you handle this situation based on your understanding of human psychology?",
                "input": f"Category: {i.category}\nContext: {i.insight}",
                "output": i.coaching_implication,
                "metadata": {
                    "source_video": i.video_id,
                    "category": i.category,
                    "quality_score": i.quality_score,
                }
            }
            examples.append(example)

        return {
            "format": "alpaca",
            "count": len(examples),
            "data": examples
        }

    elif format == "jsonl":
        # JSONL format
        lines = []
        for i in insights:
            lines.append({
                "messages": [
                    {"role": "system", "content": "You are a compassionate wellness coach."},
                    {"role": "user", "content": f"Insight about {i.category}: {i.insight}"},
                    {"role": "assistant", "content": i.coaching_implication}
                ]
            })
        return {
            "format": "jsonl",
            "count": len(lines),
            "data": lines
        }

    else:  # raw
        return {
            "format": "raw",
            "count": len(insights),
            "data": [
                {
                    "id": i.id,
                    "category": i.category,
                    "title": i.title,
                    "insight": i.insight,
                    "coaching_implication": i.coaching_implication,
                    "scores": {
                        "quality": i.quality_score,
                        "specificity": i.specificity_score,
                        "actionability": i.actionability_score,
                        "safety": i.safety_score,
                        "novelty": i.novelty_score,
                    }
                }
                for i in insights
            ]
        }


# ============================================================================
# TRANSCRIPT ENDPOINT (for compatibility with existing transcript-server)
# ============================================================================

@app.get("/transcript")
async def get_transcript(v: str = Query(..., description="Video ID")):
    """
    Fetch transcript for a video (compatible with transcript-server).
    """
    transcript = await youtube_service.download_transcript(v)

    if not transcript:
        raise HTTPException(status_code=404, detail="No transcript available")

    return {
        "videoId": v,
        "transcript": transcript,
        "charCount": len(transcript)
    }


# ============================================================================
# SIMPLE PROCESSING (Transcript + Claude only - no Whisper/prosody/facial)
# ============================================================================

class SimpleProcessRequest(BaseModel):
    """Request for simple transcript-only processing."""
    video_url: str
    auto_approve: bool = False  # Auto-approve insights with quality > 85


@app.post("/process-simple")
async def process_video_simple(request: SimpleProcessRequest, background_tasks: BackgroundTasks):
    """
    Simple processing: YouTube transcript + Claude insight extraction only.
    Much faster than full processing - no Whisper, prosody, or facial analysis.
    """
    # Extract video ID from URL
    video_url = request.video_url
    video_id = None

    if "youtube.com/watch?v=" in video_url:
        video_id = video_url.split("v=")[1].split("&")[0]
    elif "youtu.be/" in video_url:
        video_id = video_url.split("youtu.be/")[1].split("?")[0]

    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    # Get video info
    video_info = await youtube_service.get_video_info(video_id)
    if not video_info:
        raise HTTPException(status_code=404, detail="Video not found")

    # Create processing job
    job_id = str(uuid.uuid4())
    job = ProcessingJob(
        id=job_id,
        video_id=video_id,
        channel_id=video_info.channel_id or "unknown",
        status=ProcessingStatus.QUEUED,
        progress=0,
        current_step="Queued (simple mode)",
        created_at=datetime.utcnow()
    )

    active_jobs[job_id] = job

    # Start background processing
    background_tasks.add_task(
        process_video_simple_task,
        job_id,
        video_id,
        video_info,
        request.auto_approve
    )

    return {
        "job_id": job_id,
        "video_id": video_id,
        "status": "queued",
        "mode": "simple"
    }


async def process_video_simple_task(
    job_id: str,
    video_id: str,
    video_info: VideoMetadata,
    auto_approve: bool = False
):
    """Simple processing: transcript + Claude only."""
    job = active_jobs[job_id]

    try:
        # Step 1: Get YouTube transcript
        job.status = ProcessingStatus.TRANSCRIBING
        job.current_step = "Fetching YouTube transcript..."
        job.progress = 20
        job.started_at = datetime.utcnow()

        transcript_text = await youtube_service.download_transcript(video_id)

        if not transcript_text:
            raise Exception("No transcript available for this video")

        print(f"[Simple] Got transcript: {len(transcript_text)} chars")

        # Step 2: Extract insights with Claude
        job.status = ProcessingStatus.EXTRACTING_INSIGHTS
        job.current_step = "Extracting insights with Claude..."
        job.progress = 50

        # Create a simple transcript object for the insight service
        from models import TranscriptResult, TranscriptSegment
        transcript = TranscriptResult(
            text=transcript_text,
            segments=[TranscriptSegment(
                text=transcript_text,
                start=0.0,
                end=0.0,
                confidence=1.0
            )],
            language="en",
            duration=video_info.duration_seconds or 0
        )

        insights = await insight_service.extract_insights(
            transcript=transcript,
            video_title=video_info.title,
            channel_name=video_info.channel_id or "Unknown",
            prosody=None  # No prosody in simple mode
        )

        # Set video ID and optionally auto-approve
        for insight in insights:
            insight.video_id = video_id
            if auto_approve and insight.quality_score >= 85:
                insight.status = InsightStatus.APPROVED

        job.insights = insights

        # Step 3: Save to database
        job.current_step = "Saving insights..."
        job.progress = 80

        for insight in insights:
            await db.create_insight({
                "id": insight.id,
                "video_id": insight.video_id,
                "title": insight.title,
                "insight": insight.insight,
                "category": insight.category.value,
                "coaching_implication": insight.coaching_implication,
                "timestamp": insight.timestamp,
                "quality_score": insight.quality_score,
                "specificity_score": insight.specificity_score,
                "actionability_score": insight.actionability_score,
                "safety_score": insight.safety_score,
                "novelty_score": insight.novelty_score,
                "confidence": insight.confidence,
                "status": insight.status.value,
                "flagged_for_review": insight.flagged_for_review,
            })

        # Done!
        job.status = ProcessingStatus.COMPLETED
        job.current_step = "Complete"
        job.progress = 100
        job.completed_at = datetime.utcnow()

        approved_count = len([i for i in insights if i.status == InsightStatus.APPROVED])
        print(f"[Simple] Completed: {video_id} - {len(insights)} insights ({approved_count} auto-approved)")

    except Exception as e:
        job.status = ProcessingStatus.FAILED
        job.error_message = str(e)
        job.current_step = f"Failed: {str(e)[:100]}"
        print(f"[Simple] Failed: {video_id} - {e}")


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )
