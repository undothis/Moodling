"""
Training Studio - FastAPI Backend

Main application that provides REST API for:
- Channel management
- Video processing (download, transcribe, analyze)
- Insight extraction and review
- Training data export
"""

import asyncio
import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query, UploadFile, File, Form

# Get logger from config (which sets up file logging)
logger = logging.getLogger(__name__)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import shutil
import tempfile

from config import settings, init_directories, EXTRACTION_CATEGORIES, RECOMMENDED_CHANNELS, RECOMMENDED_MOVIES, ALIVENESS_CATEGORIES, VERSION, get_version_info
from database import (
    init_db, db, async_session, ChannelModel, VideoModel, ProcessingJobModel, InsightModel,
    PhilosophyModel, TenantModel, InsightComplianceModel, BrainSnapshotModel, BrainGoalModel
)
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
        version=VERSION,
        services={
            "database": True,
            "whisper": True,
            "pyannote": bool(settings.huggingface_token),
            "claude": bool(settings.anthropic_api_key),
        }
    )


@app.get("/version")
async def get_version():
    """Get detailed version information."""
    return get_version_info()


@app.get("/manual")
async def get_manual():
    """Get the training manual content."""
    manual_path = Path(__file__).parent.parent / "docs" / "AI_TRAINING_SYSTEM_MANUAL.md"
    if not manual_path.exists():
        raise HTTPException(status_code=404, detail="Manual not found")
    return {"content": manual_path.read_text()}


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

    # 10. Test Database Health
    try:
        async with async_session() as session:
            # Try to query a table with new columns to ensure schema is up to date
            from sqlalchemy import text
            # Test channels table with new column
            await session.execute(text("SELECT data_source_tier FROM channels LIMIT 1"))
            # Test processing_jobs table with new columns
            await session.execute(text("SELECT component_status_json, insights_count FROM processing_jobs LIMIT 1"))
            # Test insights table with new columns
            await session.execute(text("SELECT empathy_type, is_dialogue_chain FROM insights LIMIT 1"))
            results["database"] = {
                "status": "ok",
                "message": "Database schema up to date"
            }
    except Exception as e:
        error_msg = str(e)
        if "no such column" in error_msg.lower():
            results["database"] = {
                "status": "error",
                "message": "Database schema needs migration",
                "note": "Restart the backend to run migrations automatically",
                "detail": error_msg.split(":")[-1].strip() if ":" in error_msg else error_msg
            }
        else:
            results["database"] = {
                "status": "error",
                "message": f"Database error: {error_msg}"
            }

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


@app.get("/logs")
async def get_logs(
    lines: int = Query(100, description="Number of lines to return"),
    log_type: str = Query("all", description="Log type: 'all', 'errors', or 'recent'")
):
    """
    Get recent log entries for debugging.

    - lines: Number of log lines to return (default 100, max 1000)
    - log_type: 'all' for main log, 'errors' for error log only
    """
    from config import LOG_FILE, ERROR_LOG_FILE, LOGS_DIR
    import logging

    logger = logging.getLogger(__name__)
    lines = min(lines, 1000)  # Cap at 1000 lines

    result = {
        "log_dir": str(LOGS_DIR),
        "log_files": [],
        "entries": []
    }

    # List available log files
    if LOGS_DIR.exists():
        result["log_files"] = [f.name for f in LOGS_DIR.glob("*.log*")]

    # Choose which log file to read
    log_file = ERROR_LOG_FILE if log_type == "errors" else LOG_FILE

    try:
        if log_file.exists():
            with open(log_file, 'r', encoding='utf-8') as f:
                all_lines = f.readlines()
                # Get last N lines
                recent_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines

                # Parse log lines into structured format
                import re
                entries = []
                for line in recent_lines:
                    line = line.strip()
                    if not line:
                        continue

                    # Try to parse standard log format: YYYY-MM-DD HH:MM:SS - LEVEL - message
                    # Also handles: YYYY-MM-DD HH:MM:SS,mmm - LEVEL - message
                    match = re.match(r'^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:,\d{3})?)\s*-?\s*(\w+)\s*-?\s*(.*)$', line)
                    if match:
                        entries.append({
                            "timestamp": match.group(1),
                            "level": match.group(2).upper(),
                            "message": match.group(3)
                        })
                    else:
                        # Fallback: treat entire line as message
                        entries.append({
                            "timestamp": "",
                            "level": "INFO",
                            "message": line
                        })

                result["entries"] = entries
                result["total_lines"] = len(all_lines)
                result["returned_lines"] = len(entries)
        else:
            result["message"] = f"Log file not found: {log_file}"
            result["entries"] = [{
                "timestamp": "",
                "level": "WARNING",
                "message": f"Log file not found: {log_file}. Start the backend to generate logs."
            }]
            logger.warning(f"Log file not found: {log_file}")
    except Exception as e:
        logger.error(f"Error reading log file: {e}")
        result["error"] = str(e)
        result["entries"] = [{
            "timestamp": "",
            "level": "ERROR",
            "message": f"Error reading logs: {str(e)}"
        }]

    return result


@app.delete("/logs")
async def clear_logs():
    """Clear log files (keeps structure, removes content)."""
    from config import LOG_FILE, ERROR_LOG_FILE
    import logging

    logger = logging.getLogger(__name__)

    cleared = []
    for log_file in [LOG_FILE, ERROR_LOG_FILE]:
        try:
            if log_file.exists():
                with open(log_file, 'w', encoding='utf-8') as f:
                    f.write(f"=== Log cleared at {datetime.now().isoformat()} ===\n")
                cleared.append(str(log_file.name))
        except Exception as e:
            logger.error(f"Error clearing log {log_file}: {e}")

    logger.info("Logs cleared by user")
    return {"cleared": cleared, "message": "Logs cleared successfully"}


@app.get("/categories")
async def get_categories():
    """Get available extraction categories."""
    return EXTRACTION_CATEGORIES


@app.get("/recommended-channels")
async def get_recommended_channels():
    """Get list of recommended YouTube channels.

    Transforms URLs to use channel_id when available for reliability,
    since @handles can be claimed by different channels than expected.
    """
    transformed = []
    for ch in RECOMMENDED_CHANNELS:
        channel = dict(ch)  # Copy to avoid modifying original
        # If we have a channel_id, use it for the URL (more reliable than @handles)
        if channel.get("channel_id") and not channel.get("url", "").startswith("https://www.youtube.com/channel/"):
            channel["url"] = f"https://www.youtube.com/channel/{channel['channel_id']}"
        transformed.append(channel)
    return transformed


class AIRecommendRequest(BaseModel):
    description: str = Field(..., description="Description of what the AI should do")


@app.post("/recommend-channels-ai")
async def recommend_channels_ai(request: AIRecommendRequest):
    """Use Claude to recommend channels based on AI description."""
    import anthropic
    import json
    import re

    # Build channel list for Claude
    channel_info = []
    for ch in RECOMMENDED_CHANNELS:
        channel_info.append(f"- {ch['name']} ({ch['category']}): {ch.get('description', 'No description')}")

    channels_text = "\n".join(channel_info)

    prompt = f"""You are helping select YouTube channels to train an AI coaching assistant.

The user wants to build an AI that: {request.description}

Here are the available channels to choose from:

{channels_text}

Based on the user's description, recommend the TOP 8-10 most relevant channels for training their AI.

For each recommended channel, explain WHY it's a good fit for their specific use case.

Format your response as JSON with this structure:
{{
  "recommendations": [
    {{
      "name": "Channel Name",
      "category": "category_key",
      "reason": "2-3 sentence explanation of why this channel is perfect for their AI"
    }}
  ],
  "training_tips": "1-2 sentences of advice for training this type of AI"
}}

Only include channels from the list above. Be specific about why each channel matches their needs."""

    try:
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )

        # Parse the response
        response_text = response.content[0].text

        # Find JSON in response
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            result = json.loads(json_match.group())

            # Match recommendations back to full channel data
            enriched_recommendations = []
            for rec in result.get("recommendations", []):
                # Find the full channel data
                for ch in RECOMMENDED_CHANNELS:
                    if ch["name"].lower() == rec["name"].lower():
                        enriched_recommendations.append({
                            **ch,
                            "reason": rec.get("reason", "Recommended for your use case")
                        })
                        break

            return {
                "success": True,
                "recommendations": enriched_recommendations,
                "training_tips": result.get("training_tips", ""),
                "original_description": request.description
            }
        else:
            return {"success": False, "error": "Could not parse AI response"}

    except Exception as e:
        return {"success": False, "error": str(e)}


# ============================================================================
# MOVIE SUPPORT
# ============================================================================

@app.get("/recommended-movies")
async def get_recommended_movies():
    """Get list of recommended movies for training data."""
    return RECOMMENDED_MOVIES


@app.post("/recommend-movies-ai")
async def recommend_movies_ai(request: AIRecommendRequest):
    """Use Claude to recommend movies based on AI description."""
    import anthropic
    import json
    import re

    # Build movie list for Claude
    movie_info = []
    for m in RECOMMENDED_MOVIES:
        movie_info.append(f"- {m['title']} ({m['year']}) [{m['category']}]: {m['description']} WHY: {m['why_train']}")

    movies_text = "\n".join(movie_info)

    prompt = f"""You are helping select movies to train an AI coaching assistant.

The user wants to build an AI that: {request.description}

Here are movies with rich emotional content for training:

{movies_text}

Based on the user's description, recommend the TOP 6-8 most relevant movies for training their AI.

For each recommended movie, explain WHY it's perfect for their specific use case.

Format your response as JSON:
{{
  "recommendations": [
    {{
      "title": "Movie Title",
      "category": "category_key",
      "reason": "2-3 sentence explanation of why this movie is perfect for their AI"
    }}
  ],
  "training_tips": "1-2 sentences of advice for extracting insights from movies"
}}

Only include movies from the list above. Be specific about why each matches their needs."""

    try:
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )

        response_text = response.content[0].text
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            result = json.loads(json_match.group())

            # Match recommendations back to full movie data
            enriched_recommendations = []
            for rec in result.get("recommendations", []):
                for m in RECOMMENDED_MOVIES:
                    if m["title"].lower() == rec["title"].lower():
                        enriched_recommendations.append({
                            **m,
                            "reason": rec.get("reason", "Recommended for your use case")
                        })
                        break

            return {
                "success": True,
                "recommendations": enriched_recommendations,
                "training_tips": result.get("training_tips", ""),
                "original_description": request.description
            }
        else:
            return {"success": False, "error": "Could not parse AI response"}

    except Exception as e:
        return {"success": False, "error": str(e)}


class MovieUploadResponse(BaseModel):
    success: bool
    job_id: Optional[str] = None
    message: str


@app.post("/movies/upload")
async def upload_movie(
    background_tasks: BackgroundTasks,
    movie_file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form("general"),
):
    """
    Upload a movie file for processing.

    Uses Whisper AI to transcribe dialogue from the audio track.

    Args:
        movie_file: Video file (mp4, mkv, avi, etc.)
        title: Movie title for identification
        category: Emotional category (grief, therapy, etc.)
    """
    try:
        # Create temp directory for this movie
        movie_id = str(uuid.uuid4())
        temp_dir = Path(settings.temp_path) / movie_id
        temp_dir.mkdir(parents=True, exist_ok=True)

        # Save movie file
        movie_path = temp_dir / movie_file.filename
        with open(movie_path, "wb") as f:
            shutil.copyfileobj(movie_file.file, f)

        # Create processing job
        job_id = str(uuid.uuid4())

        # Start background processing
        background_tasks.add_task(
            process_movie_background,
            job_id=job_id,
            movie_id=movie_id,
            movie_path=str(movie_path),
            title=title,
            category=category,
        )

        return MovieUploadResponse(
            success=True,
            job_id=job_id,
            message=f"Movie '{title}' uploaded. Whisper transcription started.",
        )

    except Exception as e:
        return MovieUploadResponse(
            success=False,
            message=str(e)
        )


async def process_movie_background(
    job_id: str,
    movie_id: str,
    movie_path: str,
    title: str,
    category: str,
):
    """Background task to process an uploaded movie using Whisper transcription."""
    from models import TranscriptResult, TranscriptSegment

    try:
        # Extract audio and transcribe with Whisper
        print(f"[Movie] Running Whisper transcription for '{title}'...")
        audio_path = await extract_audio_from_video(movie_path)
        transcript_result = await transcription_service.transcribe(audio_path)
        transcript_text = transcript_result.text
        print(f"[Movie] Whisper extracted {len(transcript_text)} chars")

        if not transcript_text:
            print(f"[Movie] No transcript available for {title}")
            return

        # Create transcript object
        transcript = TranscriptResult(
            text=transcript_text,
            segments=[TranscriptSegment(
                text=transcript_text,
                start=0.0,
                end=0.0,
                confidence=1.0
            )],
            language="en",
            duration=0
        )

        # Extract insights
        print(f"[Movie] Extracting insights from '{title}'...")
        insights = await insight_service.extract_insights(
            transcript=transcript,
            video_title=f"[Movie] {title}",
            channel_name=f"Movie ({category})",
            max_insights=12  # More insights for movies
        )

        # Store insights in database
        for insight in insights:
            insight.video_id = movie_id
            insight.channel_id = f"movie_{category}"
            insight.source_token = f"movie_{movie_id[:8]}_{insight.id[:6]}"

            # Save to database
            insight_data = {
                "id": insight.id,
                "video_id": insight.video_id,
                "channel_id": insight.channel_id,
                "title": insight.title,
                "insight": insight.insight,
                "category": insight.category.value,
                "coaching_implication": insight.coaching_implication,
                "timestamp": insight.timestamp,
                "source_token": insight.source_token,
                "quality_score": insight.quality_score,
                "specificity_score": insight.specificity_score,
                "actionability_score": insight.actionability_score,
                "safety_score": insight.safety_score,
                "novelty_score": insight.novelty_score,
                "confidence": insight.confidence,
                "status": insight.status.value,
                "flagged_for_review": insight.flagged_for_review,
                "emotional_context_json": insight.emotional_context,
            }
            await db.create_insight(insight_data)

        print(f"[Movie] Stored {len(insights)} insights from '{title}'")

    except Exception as e:
        print(f"[Movie] Error processing '{title}': {e}")


async def extract_audio_from_video(video_path: str) -> str:
    """Extract audio from video file using ffmpeg."""
    import subprocess

    audio_path = video_path.rsplit('.', 1)[0] + '.wav'

    cmd = [
        'ffmpeg', '-i', video_path,
        '-vn',  # No video
        '-acodec', 'pcm_s16le',
        '-ar', '16000',  # Sample rate for Whisper
        '-ac', '1',  # Mono
        '-y',  # Overwrite
        audio_path
    ]

    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    await process.communicate()

    return audio_path


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

        # Check if channel already exists by URL pattern
        existing_channels = await db.get_all_channels()
        normalized_url = request.url.lower().replace("https://", "").replace("http://", "").replace("www.", "")
        for existing in existing_channels:
            existing_normalized = existing.url.lower().replace("https://", "").replace("http://", "").replace("www.", "")
            if normalized_url in existing_normalized or existing_normalized in normalized_url:
                return {
                    "success": True,
                    "channel": {"id": existing.id, "name": existing.name},
                    "message": "Channel already added"
                }

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
        error_msg = str(e)
        # Provide better error messages
        if "UNIQUE constraint" in error_msg:
            return {"success": True, "message": "Channel already exists"}
        print(f"[Channels] Error adding channel: {error_msg}")
        raise HTTPException(status_code=400, detail=f"Failed to add channel: {error_msg}")


@app.delete("/channels/{channel_id}")
async def delete_channel(channel_id: str):
    """Delete a channel."""
    # Note: In production, would soft-delete or handle cascade properly
    async with async_session() as session:
        from sqlalchemy import delete
        await session.execute(delete(ChannelModel).where(ChannelModel.id == channel_id))
        await session.commit()
    return {"success": True}


@app.post("/channels/{channel_id}/refresh")
async def refresh_channel(channel_id: str):
    """Refresh channel information from YouTube."""
    logger.info(f"Refreshing channel info for {channel_id}")

    channel = await db.get_channel(channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    try:
        # Re-fetch channel info from YouTube
        info = await youtube_service.get_channel_info(channel.url)
        logger.info(f"Got channel info: {info}")

        # Update channel in database
        async with async_session() as session:
            from sqlalchemy import update
            new_name = info.get("channel_name", channel.name)
            new_channel_id = info.get("channel_id", channel.channel_id)

            await session.execute(
                update(ChannelModel)
                .where(ChannelModel.id == channel_id)
                .values(
                    name=new_name,
                    channel_id=new_channel_id,
                    url=info.get("channel_url", channel.url)
                )
            )
            await session.commit()

        logger.info(f"Updated channel {channel_id}: name={new_name}")

        return {
            "success": True,
            "channel": {
                "id": channel_id,
                "name": new_name,
                "channel_id": new_channel_id
            },
            "message": f"Channel refreshed: {new_name}"
        }

    except Exception as e:
        logger.error(f"Failed to refresh channel {channel_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh: {str(e)}")


@app.get("/channels/{channel_id}/videos")
async def get_channel_videos(
    channel_id: str,
    max_videos: int = Query(default=20, le=100),
    strategy: str = Query(default="balanced")
):
    """Fetch videos from a channel for processing."""
    logger.info(f"Brain Studio: Fetching videos for channel {channel_id} (max={max_videos}, strategy={strategy})")
    channel = await db.get_channel(channel_id)
    if not channel:
        logger.warning(f"Brain Studio: Channel {channel_id} not found")
        raise HTTPException(status_code=404, detail="Channel not found")

    logger.info(f"Brain Studio: Fetching from URL: {channel.url}")

    try:
        videos = await youtube_service.fetch_channel_videos(
            channel.url,
            max_videos=max_videos,
            strategy=strategy
        )
        logger.info(f"Brain Studio: Found {len(videos)} videos for channel {channel.name}")

        return {
            "channel_id": channel_id,
            "channel_name": channel.name,
            "channel_url": channel.url,
            "videos": [v.model_dump() for v in videos],
            "video_count": len(videos)
        }
    except Exception as e:
        logger.error(f"Brain Studio: Error fetching videos: {str(e)}")
        return {
            "channel_id": channel_id,
            "channel_name": channel.name,
            "channel_url": channel.url,
            "videos": [],
            "video_count": 0,
            "error": str(e)
        }


@app.get("/test-video-fetch")
async def test_video_fetch(url: str = Query(..., description="YouTube channel URL to test")):
    """Debug endpoint to test video fetching directly."""
    logger.info(f"Test video fetch for URL: {url}")

    try:
        videos = await youtube_service.fetch_channel_videos(url, max_videos=5)
        return {
            "success": True,
            "url": url,
            "video_count": len(videos),
            "videos": [{"id": v.video_id, "title": v.title, "duration": v.duration_seconds} for v in videos]
        }
    except Exception as e:
        logger.error(f"Test video fetch error: {str(e)}")
        return {
            "success": False,
            "url": url,
            "error": str(e)
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

    # Create processing job with initial component status
    job_id = str(uuid.uuid4())
    job = ProcessingJob(
        id=job_id,
        video_id=video_id,
        channel_id=video_info.channel_id or "unknown",
        status=ProcessingStatus.QUEUED,
        progress=0,
        current_step="Queued",
        created_at=datetime.utcnow(),
        component_status={
            "yt_dlp": {"status": "pending", "message": "Waiting to download"},
            "ffmpeg": {"status": "pending", "message": "Waiting for audio extraction"},
            "whisper": {"status": "pending", "message": "Waiting to transcribe"},
            "diarization": {"status": "pending", "message": "Waiting for speaker detection"},
            "prosody": {"status": "pending" if not request.skip_prosody else "skipped", "message": "Waiting for voice analysis" if not request.skip_prosody else "Skipped"},
            "facial": {"status": "pending" if not request.skip_facial else "skipped", "message": "Waiting for facial analysis" if not request.skip_facial else "Skipped"},
            "claude": {"status": "pending", "message": "Waiting for insight extraction"},
        }
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
        "component_status": job.component_status,
        "aliveness_scores": job.aliveness_scores,
    }


@app.get("/jobs")
async def list_jobs():
    """List all processing jobs (active + completed from database)."""
    # Get active jobs from memory
    active = [
        {
            "job_id": job_id,
            "video_id": job.video_id,
            "status": job.status.value,
            "progress": job.progress,
            "current_step": job.current_step,
            "created_at": job.created_at,
            "completed_at": job.completed_at,
            "component_status": job.component_status,
            "aliveness_scores": job.aliveness_scores,
            "insights_count": len(job.insights),
        }
        for job_id, job in active_jobs.items()
    ]

    # Get completed/failed jobs from database (that are not in active_jobs)
    active_video_ids = {job.video_id for job in active_jobs.values()}
    completed_jobs = await db.get_completed_jobs()
    db_jobs = [j for j in completed_jobs if j["video_id"] not in active_video_ids]

    # Combine and return
    return active + db_jobs


@app.post("/jobs/{job_id}/cancel")
async def cancel_job(job_id: str):
    """Cancel a processing job."""
    if job_id not in active_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = active_jobs[job_id]

    if job.status in [ProcessingStatus.COMPLETED, ProcessingStatus.FAILED]:
        return {"message": "Job already finished", "status": job.status.value}

    # Mark as cancelled
    job.status = ProcessingStatus.FAILED
    job.error_message = "Cancelled by user"
    job.current_step = "Cancelled"
    job.completed_at = datetime.now().isoformat()

    logger.info(f"Job {job_id} cancelled by user")

    return {"message": "Job cancelled", "job_id": job_id}


@app.delete("/jobs/{job_id}")
async def remove_job(job_id: str):
    """Remove a job from the active jobs list."""
    if job_id in active_jobs:
        job = active_jobs[job_id]
        if job.status not in [ProcessingStatus.COMPLETED, ProcessingStatus.FAILED]:
            # Cancel it first
            job.status = ProcessingStatus.FAILED
            job.error_message = "Removed by user"
        del active_jobs[job_id]
        return {"message": "Job removed", "job_id": job_id}

    raise HTTPException(status_code=404, detail="Job not found")


async def process_video_task(
    job_id: str,
    video_id: str,
    video_info: VideoMetadata,
    skip_facial: bool = False,
    skip_prosody: bool = False
):
    """Background task for video processing."""
    job = active_jobs[job_id]

    # Initialize component status tracking
    job.component_status = {
        "yt_dlp": {"status": "pending", "message": "Waiting to download"},
        "ffmpeg": {"status": "pending", "message": "Waiting for audio extraction"},
        "whisper": {"status": "pending", "message": "Waiting to transcribe"},
        "diarization": {"status": "pending", "message": "Waiting for speaker detection"},
        "prosody": {"status": "pending" if not skip_prosody else "skipped", "message": "Waiting for voice analysis" if not skip_prosody else "Skipped"},
        "facial": {"status": "pending" if not skip_facial else "skipped", "message": "Waiting for facial analysis" if not skip_facial else "Skipped"},
        "claude": {"status": "pending", "message": "Waiting for insight extraction"},
    }

    try:
        # Step 1: Download video/audio
        job.status = ProcessingStatus.DOWNLOADING
        job.current_step = "Downloading video..."
        job.progress = 5
        job.started_at = datetime.utcnow()
        job.component_status["yt_dlp"] = {"status": "running", "message": "Downloading from YouTube..."}

        downloads = await youtube_service.download_video(
            video_id,
            download_video=not skip_facial,
            download_audio=True
        )

        if not downloads.get("audio_path"):
            job.component_status["yt_dlp"] = {"status": "error", "message": "Failed to download audio"}
            raise Exception("Failed to download audio")

        audio_path = downloads["audio_path"]
        video_path = downloads.get("video_path")
        job.component_status["yt_dlp"] = {"status": "ok", "message": "Video downloaded"}
        job.component_status["ffmpeg"] = {"status": "ok", "message": "Audio extracted to WAV"}

        # Step 2: Transcription
        job.status = ProcessingStatus.TRANSCRIBING
        job.current_step = "Transcribing audio with Whisper..."
        job.progress = 20
        job.component_status["whisper"] = {"status": "running", "message": "Transcribing audio..."}

        # Try Whisper, fall back to YouTube transcript
        whisper_used = False
        try:
            transcript = await transcription_service.transcribe(audio_path)
            whisper_used = True
            word_count = len(transcript.text.split())
            job.component_status["whisper"] = {"status": "ok", "message": f"Transcribed {word_count} words"}
        except Exception as e:
            print(f"[Process] Whisper failed: {e}, trying YouTube transcript")
            job.component_status["whisper"] = {"status": "warning", "message": f"Whisper failed, using YouTube captions"}
            yt_transcript = await youtube_service.download_transcript(video_id)
            if yt_transcript:
                transcript = await transcription_service.transcribe_with_fallback(
                    audio_path, yt_transcript
                )
            else:
                job.component_status["whisper"] = {"status": "error", "message": "No transcript available"}
                raise Exception("No transcript available")

        job.transcript = transcript

        # Step 3: Speaker diarization
        job.status = ProcessingStatus.DIARIZING
        job.current_step = "Identifying speakers..."
        job.progress = 40
        job.component_status["diarization"] = {"status": "running", "message": "Detecting speakers..."}

        diarization = await diarization_service.diarize(audio_path)
        if diarization:
            transcript = diarization_service.merge_transcript_with_diarization(
                transcript, diarization
            )
            speaker_stats = diarization_service.calculate_speaker_statistics(diarization)
            job.speaker_profiles = list(speaker_stats.values())
            job.component_status["diarization"] = {"status": "ok", "message": f"Found {len(speaker_stats)} speakers"}
        else:
            job.component_status["diarization"] = {"status": "warning", "message": "No HF token or diarization failed"}

        # Step 4: Prosody extraction
        if not skip_prosody:
            job.status = ProcessingStatus.EXTRACTING_PROSODY
            job.current_step = "Analyzing voice patterns (prosody)..."
            job.progress = 55
            job.component_status["prosody"] = {"status": "running", "message": "Analyzing pitch, rhythm, pauses..."}

            try:
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
                job.component_status["prosody"] = {
                    "status": "ok",
                    "message": f"Aliveness: {prosody.aliveness_score:.0f}%, Naturalness: {prosody.naturalness_score:.0f}%"
                }
            except Exception as e:
                print(f"[Process] Prosody extraction failed: {e}")
                job.component_status["prosody"] = {"status": "error", "message": str(e)[:50]}
                prosody = None
        else:
            prosody = None

        # Step 5: Facial analysis (optional)
        facial_features = None
        if not skip_facial and video_path:
            job.status = ProcessingStatus.ANALYZING_FACIAL
            job.current_step = "Analyzing facial expressions..."
            job.progress = 70
            job.component_status["facial"] = {"status": "running", "message": "Detecting faces and expressions..."}

            try:
                frame_results = await facial_service.analyze_video(
                    video_path,
                    sample_rate=5  # Every 5th frame
                )
                if frame_results:
                    facial_features = await facial_service.aggregate_analysis(frame_results)
                    job.component_status["facial"] = {"status": "ok", "message": f"Analyzed {len(frame_results)} frames"}
                else:
                    job.component_status["facial"] = {"status": "warning", "message": "No faces detected"}
            except Exception as e:
                print(f"[Process] Facial analysis failed: {e}")
                job.component_status["facial"] = {"status": "error", "message": str(e)[:50]}

        # Step 6: Interview classification
        job.current_step = "Classifying interview type..."
        job.progress = 80

        classification = await insight_service.classify_interview(transcript)
        job.interview_type = classification.get("interview_type")
        job.therapeutic_approach = classification.get("therapeutic_approach")

        # Step 7: Insight extraction
        job.status = ProcessingStatus.EXTRACTING_INSIGHTS
        job.current_step = "Extracting insights with Claude..."
        job.progress = 85
        job.component_status["claude"] = {"status": "running", "message": "Claude is analyzing transcript..."}

        try:
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
            job.component_status["claude"] = {"status": "ok", "message": f"Extracted {len(insights)} insights"}
        except Exception as e:
            print(f"[Process] Insight extraction failed: {e}")
            job.component_status["claude"] = {"status": "error", "message": str(e)[:50]}
            raise

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

        # Persist job to database for crash recovery
        await db.save_processing_job({
            "id": job_id,
            "video_id": video_id,
            "status": "completed",
            "progress": 100,
            "current_step": "Complete",
            "completed_at": job.completed_at,
            "component_status_json": job.component_status,
            "aliveness_scores_json": job.aliveness_scores,
            "insights_count": len(insights),
        })

        print(f"[Process] Completed: {video_id} - {len(insights)} insights extracted")

    except Exception as e:
        job.status = ProcessingStatus.FAILED
        job.error_message = str(e)
        job.current_step = f"Failed: {str(e)[:100]}"
        print(f"[Process] Failed: {video_id} - {e}")

        # Persist failed job to database
        await db.save_processing_job({
            "id": job_id,
            "video_id": video_id,
            "status": "failed",
            "progress": job.progress,
            "current_step": job.current_step,
            "error_message": str(e),
            "component_status_json": job.component_status,
        })

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
    # Accept keys starting with sk-ant- or sk- (newer format)
    if not (request.api_key.startswith("sk-ant-") or request.api_key.startswith("sk-")):
        raise HTTPException(status_code=400, detail="Invalid API key format. Key should start with 'sk-'")

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


class HuggingFaceTokenRequest(BaseModel):
    token: str


@app.post("/config/huggingface-token")
async def set_huggingface_token(request: HuggingFaceTokenRequest):
    """Set the HuggingFace token (stored in memory, not persisted)."""
    if not request.token.startswith("hf_"):
        raise HTTPException(status_code=400, detail="Invalid token format. Token should start with 'hf_'")

    # Update the settings in memory
    settings.huggingface_token = request.token

    return {"success": True, "message": "HuggingFace token updated"}


@app.get("/config/huggingface-status")
async def get_huggingface_status():
    """Check if HuggingFace token is configured."""
    has_token = bool(settings.huggingface_token)
    # Show only last 4 chars for security
    masked = f"...{settings.huggingface_token[-4:]}" if has_token else None
    return {
        "configured": has_token,
        "masked_token": masked
    }


# ============================================================================
# TUNING DASHBOARD - Source Management & Influence Control
# ============================================================================

@app.get("/tuning/channels")
async def get_channel_statistics():
    """
    Get detailed statistics for each channel for tuning dashboard.
    Shows contribution, quality scores, and influence settings.
    """
    stats = await db.get_channel_statistics()
    return {"channels": stats}


@app.get("/tuning/videos")
async def get_video_statistics():
    """Get statistics for each processed video."""
    stats = await db.get_video_statistics()
    return {"videos": stats}


class UpdateChannelWeightRequest(BaseModel):
    """Request to update channel influence weight."""
    influence_weight: float  # 0.0 to 2.0
    include_in_training: Optional[bool] = None
    notes: Optional[str] = None


@app.put("/tuning/channels/{channel_id}/weight")
async def update_channel_weight(channel_id: str, request: UpdateChannelWeightRequest):
    """
    Update channel's influence weight for training.
    Weight: 0.0 = exclude, 0.5 = half influence, 1.0 = normal, 2.0 = double influence
    """
    if not 0.0 <= request.influence_weight <= 2.0:
        raise HTTPException(status_code=400, detail="Weight must be between 0.0 and 2.0")

    updates = {"influence_weight": request.influence_weight}
    if request.include_in_training is not None:
        updates["include_in_training"] = request.include_in_training
    if request.notes is not None:
        updates["notes"] = request.notes

    channel = await db.update_channel(channel_id, updates)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    return {
        "success": True,
        "channel_id": channel_id,
        "influence_weight": request.influence_weight
    }


@app.delete("/tuning/channels/{channel_id}/insights")
async def delete_channel_insights(channel_id: str):
    """Delete all insights from a specific channel."""
    count = await db.delete_insights_by_channel(channel_id)
    return {
        "success": True,
        "deleted_count": count,
        "channel_id": channel_id
    }


@app.delete("/tuning/videos/{video_id}/insights")
async def delete_video_insights(video_id: str):
    """Delete all insights from a specific video."""
    count = await db.delete_insights_by_video(video_id)
    return {
        "success": True,
        "deleted_count": count,
        "video_id": video_id
    }


@app.get("/tuning/quality-alerts")
async def get_quality_alerts():
    """
    Identify problematic data sources - channels and videos with low quality.
    Helps pinpoint what's contributing to bad training data.
    """
    all_insights = await db.get_all_insights()
    channels = await db.get_all_channels()

    channel_map = {c.id: c.name for c in channels}

    # Aggregate by channel
    channel_stats = {}
    video_stats = {}

    for i in all_insights:
        ch_id = i.channel_id or "unknown"
        vid_id = i.video_id or "unknown"

        # Channel stats
        if ch_id not in channel_stats:
            channel_stats[ch_id] = {
                "channel_id": ch_id,
                "channel_name": channel_map.get(ch_id, "Unknown"),
                "total_insights": 0,
                "low_quality_count": 0,  # quality < 70
                "low_safety_count": 0,   # safety < 70
                "flagged_count": 0,
                "rejected_count": 0,
                "quality_scores": [],
                "safety_scores": [],
                "categories": {}
            }
        channel_stats[ch_id]["total_insights"] += 1
        channel_stats[ch_id]["quality_scores"].append(i.quality_score)
        channel_stats[ch_id]["safety_scores"].append(i.safety_score)
        if i.quality_score < 70:
            channel_stats[ch_id]["low_quality_count"] += 1
        if i.safety_score < 70:
            channel_stats[ch_id]["low_safety_count"] += 1
        if i.flagged_for_review:
            channel_stats[ch_id]["flagged_count"] += 1
        if i.status == "rejected":
            channel_stats[ch_id]["rejected_count"] += 1
        cat = i.category or "unknown"
        channel_stats[ch_id]["categories"][cat] = channel_stats[ch_id]["categories"].get(cat, 0) + 1

        # Video stats
        if vid_id not in video_stats:
            video_stats[vid_id] = {
                "video_id": vid_id,
                "channel_id": ch_id,
                "channel_name": channel_map.get(ch_id, "Unknown"),
                "total_insights": 0,
                "low_quality_count": 0,
                "low_safety_count": 0,
                "flagged_count": 0,
                "quality_scores": [],
                "safety_scores": [],
            }
        video_stats[vid_id]["total_insights"] += 1
        video_stats[vid_id]["quality_scores"].append(i.quality_score)
        video_stats[vid_id]["safety_scores"].append(i.safety_score)
        if i.quality_score < 70:
            video_stats[vid_id]["low_quality_count"] += 1
        if i.safety_score < 70:
            video_stats[vid_id]["low_safety_count"] += 1
        if i.flagged_for_review:
            video_stats[vid_id]["flagged_count"] += 1

    # Calculate averages and identify problematic sources
    problematic_channels = []
    for ch_id, stats in channel_stats.items():
        if stats["quality_scores"]:
            stats["avg_quality"] = round(sum(stats["quality_scores"]) / len(stats["quality_scores"]), 1)
            stats["avg_safety"] = round(sum(stats["safety_scores"]) / len(stats["safety_scores"]), 1)
            del stats["quality_scores"]
            del stats["safety_scores"]

            # Flag as problematic if:
            # - Average quality < 75
            # - Average safety < 75
            # - More than 30% flagged or rejected
            # - More than 20% low quality
            problem_score = 0
            problems = []

            if stats["avg_quality"] < 75:
                problem_score += 3
                problems.append(f"Low avg quality ({stats['avg_quality']})")
            if stats["avg_safety"] < 75:
                problem_score += 4
                problems.append(f"Low avg safety ({stats['avg_safety']})")

            flag_rate = (stats["flagged_count"] + stats["rejected_count"]) / stats["total_insights"]
            if flag_rate > 0.3:
                problem_score += 2
                problems.append(f"High flag/reject rate ({round(flag_rate * 100)}%)")

            low_quality_rate = stats["low_quality_count"] / stats["total_insights"]
            if low_quality_rate > 0.2:
                problem_score += 2
                problems.append(f"Many low-quality insights ({round(low_quality_rate * 100)}%)")

            low_safety_rate = stats["low_safety_count"] / stats["total_insights"]
            if low_safety_rate > 0.1:
                problem_score += 3
                problems.append(f"Safety concerns ({round(low_safety_rate * 100)}% unsafe)")

            if problem_score > 0:
                stats["problem_score"] = problem_score
                stats["problems"] = problems
                problematic_channels.append(stats)

    problematic_videos = []
    for vid_id, stats in video_stats.items():
        if stats["quality_scores"]:
            stats["avg_quality"] = round(sum(stats["quality_scores"]) / len(stats["quality_scores"]), 1)
            stats["avg_safety"] = round(sum(stats["safety_scores"]) / len(stats["safety_scores"]), 1)
            del stats["quality_scores"]
            del stats["safety_scores"]

            problem_score = 0
            problems = []

            if stats["avg_quality"] < 70:
                problem_score += 3
                problems.append(f"Low quality ({stats['avg_quality']})")
            if stats["avg_safety"] < 70:
                problem_score += 4
                problems.append(f"Safety concerns ({stats['avg_safety']})")
            if stats["flagged_count"] > 0:
                problem_score += 1
                problems.append(f"{stats['flagged_count']} flagged insights")

            if problem_score > 0:
                stats["problem_score"] = problem_score
                stats["problems"] = problems
                problematic_videos.append(stats)

    # Sort by problem severity
    problematic_channels.sort(key=lambda x: x.get("problem_score", 0), reverse=True)
    problematic_videos.sort(key=lambda x: x.get("problem_score", 0), reverse=True)

    return {
        "problematic_channels": problematic_channels[:20],
        "problematic_videos": problematic_videos[:30],
        "summary": {
            "total_channels_analyzed": len(channel_stats),
            "channels_with_issues": len(problematic_channels),
            "total_videos_analyzed": len(video_stats),
            "videos_with_issues": len(problematic_videos),
        }
    }


@app.get("/tuning/source-tokens")
async def get_source_tokens():
    """
    Get all unique source tokens for tracking training data provenance.
    Useful for identifying which data influenced model behavior.
    """
    insights = await db.get_all_insights(status="approved")

    tokens = {}
    for insight in insights:
        token = insight.source_token or f"{insight.channel_id}_{insight.video_id}_{insight.id[:8]}"
        if token not in tokens:
            tokens[token] = {
                "token": token,
                "channel_id": insight.channel_id,
                "video_id": insight.video_id,
                "insight_count": 0,
                "categories": set(),
            }
        tokens[token]["insight_count"] += 1
        tokens[token]["categories"].add(insight.category)

    # Convert sets to lists for JSON
    for t in tokens.values():
        t["categories"] = list(t["categories"])

    return {"source_tokens": list(tokens.values())}


# ============================================================================
# EXTRACTION VERIFICATION - Testing System for Category Coverage
# ============================================================================

@app.get("/extraction-verification")
async def get_extraction_verification():
    """
    Get extraction verification statistics showing all categories with
    percentages and checkmarks/status indicators.

    This endpoint helps verify that the harvesting pipeline is working
    correctly by showing coverage across all extraction categories.
    """
    insights = await db.get_all_insights()
    total_insights = len(insights)

    if total_insights == 0:
        # Return empty state with all categories marked as not started
        all_categories = {}

        # Add standard extraction categories
        for cat_key, cat_desc in EXTRACTION_CATEGORIES.items():
            all_categories[cat_key] = {
                "name": cat_key.replace("_", " ").title(),
                "description": cat_desc,
                "type": "standard",
                "count": 0,
                "percentage": 0.0,
                "status": "not_started",
                "status_icon": "⚪",
                "quality_avg": 0,
                "safety_avg": 0,
            }

        # Add aliveness categories
        for cat_key, cat_data in ALIVENESS_CATEGORIES.items():
            all_categories[f"aliveness_{cat_key}"] = {
                "name": cat_key.replace("_", " ").title(),
                "description": cat_data["description"],
                "type": "aliveness",
                "tier": _get_aliveness_tier(cat_key),
                "why_human": cat_data.get("why_human", ""),
                "count": 0,
                "percentage": 0.0,
                "status": "not_started",
                "status_icon": "⚪",
                "quality_avg": 0,
                "safety_avg": 0,
            }

        return {
            "summary": {
                "total_insights": 0,
                "categories_with_data": 0,
                "total_categories": len(all_categories),
                "overall_health": "not_started",
                "overall_health_icon": "⚪",
                "coverage_percentage": 0.0,
            },
            "categories": all_categories,
            "tiers": {
                "emotional_texture": {"count": 0, "categories": 0, "health": "not_started"},
                "cognitive_patterns": {"count": 0, "categories": 0, "health": "not_started"},
                "self_protective": {"count": 0, "categories": 0, "health": "not_started"},
                "relational_signals": {"count": 0, "categories": 0, "health": "not_started"},
                "authenticity_markers": {"count": 0, "categories": 0, "health": "not_started"},
                "meta_conversational": {"count": 0, "categories": 0, "health": "not_started"},
                "rare_gold": {"count": 0, "categories": 0, "health": "not_started"},
            },
            "recommendations": [
                "Start by adding some YouTube channels or processing videos",
                "Use the recommended channels list for quality sources",
                "Run diagnostics to ensure all components are working"
            ]
        }

    # Count insights per category
    category_counts = {}
    category_quality = {}
    category_safety = {}

    for insight in insights:
        cat = insight.category or "unknown"
        category_counts[cat] = category_counts.get(cat, 0) + 1

        if cat not in category_quality:
            category_quality[cat] = []
            category_safety[cat] = []
        category_quality[cat].append(insight.quality_score)
        category_safety[cat].append(insight.safety_score)

    # Build comprehensive category report
    all_categories = {}

    # Add standard extraction categories
    for cat_key, cat_desc in EXTRACTION_CATEGORIES.items():
        count = category_counts.get(cat_key, 0)
        percentage = (count / total_insights * 100) if total_insights > 0 else 0
        quality_avg = sum(category_quality.get(cat_key, [0])) / max(len(category_quality.get(cat_key, [1])), 1)
        safety_avg = sum(category_safety.get(cat_key, [0])) / max(len(category_safety.get(cat_key, [1])), 1)

        status, status_icon = _get_category_status(count, percentage, quality_avg, safety_avg)

        all_categories[cat_key] = {
            "name": cat_key.replace("_", " ").title(),
            "description": cat_desc,
            "type": "standard",
            "count": count,
            "percentage": round(percentage, 2),
            "status": status,
            "status_icon": status_icon,
            "quality_avg": round(quality_avg, 1),
            "safety_avg": round(safety_avg, 1),
        }

    # Add aliveness categories
    for cat_key, cat_data in ALIVENESS_CATEGORIES.items():
        count = category_counts.get(cat_key, 0)
        percentage = (count / total_insights * 100) if total_insights > 0 else 0
        quality_avg = sum(category_quality.get(cat_key, [0])) / max(len(category_quality.get(cat_key, [1])), 1)
        safety_avg = sum(category_safety.get(cat_key, [0])) / max(len(category_safety.get(cat_key, [1])), 1)

        status, status_icon = _get_category_status(count, percentage, quality_avg, safety_avg)

        all_categories[f"aliveness_{cat_key}"] = {
            "name": cat_key.replace("_", " ").title(),
            "description": cat_data["description"],
            "type": "aliveness",
            "tier": _get_aliveness_tier(cat_key),
            "why_human": cat_data.get("why_human", ""),
            "coach_note": cat_data.get("Coach_note", ""),
            "count": count,
            "percentage": round(percentage, 2),
            "status": status,
            "status_icon": status_icon,
            "quality_avg": round(quality_avg, 1),
            "safety_avg": round(safety_avg, 1),
        }

    # Calculate tier statistics for aliveness categories
    tier_stats = {
        "emotional_texture": {"count": 0, "categories": 0, "category_list": []},
        "cognitive_patterns": {"count": 0, "categories": 0, "category_list": []},
        "self_protective": {"count": 0, "categories": 0, "category_list": []},
        "relational_signals": {"count": 0, "categories": 0, "category_list": []},
        "authenticity_markers": {"count": 0, "categories": 0, "category_list": []},
        "meta_conversational": {"count": 0, "categories": 0, "category_list": []},
        "rare_gold": {"count": 0, "categories": 0, "category_list": []},
    }

    for cat_key, cat_info in all_categories.items():
        if cat_info.get("type") == "aliveness":
            tier = cat_info.get("tier", "other")
            if tier in tier_stats:
                tier_stats[tier]["count"] += cat_info["count"]
                tier_stats[tier]["categories"] += 1
                if cat_info["count"] > 0:
                    tier_stats[tier]["category_list"].append(cat_info["name"])

    # Calculate tier health
    for tier, stats in tier_stats.items():
        if stats["count"] == 0:
            stats["health"] = "not_started"
            stats["health_icon"] = "⚪"
        elif stats["count"] < 5:
            stats["health"] = "needs_data"
            stats["health_icon"] = "🟡"
        elif stats["count"] < 20:
            stats["health"] = "growing"
            stats["health_icon"] = "🟢"
        else:
            stats["health"] = "healthy"
            stats["health_icon"] = "✅"

    # Calculate overall health
    categories_with_data = sum(1 for c in all_categories.values() if c["count"] > 0)
    coverage_percentage = (categories_with_data / len(all_categories) * 100) if all_categories else 0

    if coverage_percentage == 0:
        overall_health = "not_started"
        overall_health_icon = "⚪"
    elif coverage_percentage < 25:
        overall_health = "needs_attention"
        overall_health_icon = "🔴"
    elif coverage_percentage < 50:
        overall_health = "developing"
        overall_health_icon = "🟡"
    elif coverage_percentage < 75:
        overall_health = "good"
        overall_health_icon = "🟢"
    else:
        overall_health = "excellent"
        overall_health_icon = "✅"

    # Generate recommendations
    recommendations = []

    # Find categories with no data
    empty_categories = [k for k, v in all_categories.items() if v["count"] == 0]
    if len(empty_categories) > 10:
        recommendations.append(f"⚠️ {len(empty_categories)} categories have no data - consider processing more diverse content")

    # Find low quality categories
    low_quality = [k for k, v in all_categories.items() if v["count"] > 0 and v["quality_avg"] < 70]
    if low_quality:
        recommendations.append(f"📊 {len(low_quality)} categories have low quality scores - review extraction settings")

    # Find low safety categories
    low_safety = [k for k, v in all_categories.items() if v["count"] > 0 and v["safety_avg"] < 80]
    if low_safety:
        recommendations.append(f"⚠️ {len(low_safety)} categories have safety concerns - manual review recommended")

    # Tier-specific recommendations
    for tier, stats in tier_stats.items():
        if stats["count"] == 0:
            tier_name = tier.replace("_", " ").title()
            recommendations.append(f"📝 No data for {tier_name} tier - add content with these emotional textures")

    if not recommendations:
        recommendations.append("✅ Extraction pipeline is healthy - continue monitoring")

    return {
        "summary": {
            "total_insights": total_insights,
            "categories_with_data": categories_with_data,
            "total_categories": len(all_categories),
            "overall_health": overall_health,
            "overall_health_icon": overall_health_icon,
            "coverage_percentage": round(coverage_percentage, 1),
        },
        "categories": all_categories,
        "tiers": tier_stats,
        "recommendations": recommendations,
    }


def _get_category_status(count: int, percentage: float, quality_avg: float, safety_avg: float) -> tuple:
    """Determine status and icon for a category based on metrics."""
    if count == 0:
        return "not_started", "⚪"
    elif safety_avg < 70:
        return "safety_concern", "🔴"
    elif quality_avg < 60:
        return "low_quality", "🟠"
    elif count < 3:
        return "needs_data", "🟡"
    elif quality_avg >= 80 and safety_avg >= 90:
        return "excellent", "✅"
    elif quality_avg >= 70:
        return "good", "🟢"
    else:
        return "moderate", "🟡"


def _get_aliveness_tier(category_key: str) -> str:
    """Map aliveness category to its tier."""
    emotional_texture = ["emotional_granularity", "mixed_feelings", "somatic_markers", "emotional_evolution"]
    cognitive_patterns = ["temporal_orientation", "contradiction_holding", "narrative_identity", "cognitive_patterns"]
    self_protective = ["micro_confession", "hedging_shields", "permission_seeking", "topic_circling", "retreat_signals"]
    relational_signals = ["repair_attempts", "bids_for_witness", "attachment_echoes", "pronoun_patterns"]
    authenticity_markers = ["guarded_hope", "humor_function", "performed_vs_authentic_vulnerability", "unresolved_questions"]
    meta_conversational = ["tone_shifts", "meaningful_silence", "what_not_said", "readiness_signals"]
    rare_gold = ["self_kindness_moments", "values_in_conflict", "identity_friction", "memory_echoes", "meaning_resistance", "integration_moments"]

    if category_key in emotional_texture:
        return "emotional_texture"
    elif category_key in cognitive_patterns:
        return "cognitive_patterns"
    elif category_key in self_protective:
        return "self_protective"
    elif category_key in relational_signals:
        return "relational_signals"
    elif category_key in authenticity_markers:
        return "authenticity_markers"
    elif category_key in meta_conversational:
        return "meta_conversational"
    elif category_key in rare_gold:
        return "rare_gold"
    else:
        return "other"


# ============================================================================
# COMPREHENSIVE ANALYSIS STATISTICS
# ============================================================================

@app.get("/stats/analysis")
async def get_analysis_statistics():
    """
    Get comprehensive statistics on all analysis performed.
    Includes prosody, facial, and other analysis metrics.
    """
    # This would aggregate data from processing jobs
    # For now, return the structure - actual data comes from jobs

    return {
        "prosody": {
            "description": "Voice and speech pattern analysis",
            "metrics": {
                "pitch": {
                    "name": "Pitch Analysis",
                    "description": "Fundamental frequency (F0) patterns",
                    "measures": ["mean", "std", "range", "trajectory"]
                },
                "rhythm": {
                    "name": "Rhythm Analysis",
                    "description": "Speech rate and tempo patterns",
                    "measures": ["speech_rate_wpm", "syllables_per_second", "tempo_variability"]
                },
                "pauses": {
                    "name": "Pause Analysis",
                    "description": "Silent and filled pause patterns",
                    "measures": ["frequency_per_minute", "mean_duration", "pattern"]
                },
                "volume": {
                    "name": "Volume Analysis",
                    "description": "Loudness and intensity patterns",
                    "measures": ["mean_db", "range_db", "trajectory"]
                },
                "voice_quality": {
                    "name": "Voice Quality",
                    "description": "Voice characteristics from Praat",
                    "measures": ["jitter", "shimmer", "hnr", "breathiness", "creakiness"]
                }
            },
            "composite_scores": ["aliveness_score", "naturalness_score", "expressiveness", "engagement_score"]
        },
        "distress_markers": {
            "description": "Emotional distress detection",
            "metrics": {
                "crying": ["detected", "type", "intensity"],
                "voice_breaks": ["count", "timestamps"],
                "tremor": ["detected", "severity", "pattern"],
                "breathing": ["pattern", "distress_level"]
            }
        },
        "facial": {
            "description": "Facial expression analysis",
            "metrics": {
                "emotions": {
                    "name": "Emotion Detection",
                    "categories": ["happiness", "sadness", "anger", "fear", "surprise", "disgust", "contempt", "neutral"]
                },
                "action_units": {
                    "name": "Facial Action Units (FACS)",
                    "description": "Muscle movement patterns"
                },
                "gaze": {
                    "name": "Gaze Analysis",
                    "measures": ["direction", "focus_score", "aversion_frequency"]
                }
            }
        },
        "linguistic": {
            "description": "Speech content analysis",
            "metrics": {
                "transcript": ["word_count", "duration", "language"],
                "diarization": ["speaker_count", "turn_taking_rate"],
                "classification": ["interview_type", "therapeutic_approach"]
            }
        }
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
    status: str = Query(default="approved"),
    apply_weights: bool = Query(default=True)
):
    """
    Export training data in various formats with source tracking.

    Formats:
    - alpaca: Classic Alpaca format (instruction/input/output) - basic Q&A
    - chatml: ChatML format for Llama 3+, OpenAI - multi-turn with system prompt
    - sharegpt: ShareGPT format for Unsloth - community standard
    - conversations: Rich multi-turn with full emotional context
    - aliveness: ★ NEW - Full texture markers with Coach guidance (RECOMMENDED)
    - jsonl: JSON Lines format
    - raw: Raw insight data with all fields

    The 'aliveness' format is RECOMMENDED for training AI that feels genuinely human.
    It includes:
    - Texture markers (emotional granularity, self-protection, ambivalence)
    - Coach guidance (what to do, what to avoid, example responses)
    - Ready-to-use training pairs with system prompts
    - MoodLeaf philosophy embedded in each example

    Features:
    - Includes source_token for tracking which data influenced model
    - Includes emotional_context from facial/voice analysis when available
    - Applies channel influence_weight (set apply_weights=false to skip)
    - Filters out channels with include_in_training=false
    """
    insights = await db.get_all_insights(status=status)

    # Get channel weights for filtering and weighting
    channels = await db.get_all_channels()
    channel_weights = {c.id: {
        "weight": c.influence_weight,
        "include": c.include_in_training,
        "name": c.name
    } for c in channels}

    # Filter insights based on channel settings
    filtered_insights = []
    for i in insights:
        ch_settings = channel_weights.get(i.channel_id, {"weight": 1.0, "include": True})
        if ch_settings["include"]:
            filtered_insights.append((i, ch_settings["weight"], ch_settings.get("name", "Unknown")))

    if format == "alpaca":
        # Alpaca format for Llama fine-tuning with source tracking
        examples = []
        for i, weight, ch_name in filtered_insights:
            source_token = i.source_token or f"ch{i.channel_id[:6]}_v{i.video_id[:8]}_i{i.id[:6]}"

            example = {
                "instruction": f"As a wellness coach, how should you handle this situation based on your understanding of human psychology?",
                "input": f"Category: {i.category}\nContext: {i.insight}",
                "output": i.coaching_implication,
                "metadata": {
                    "source_token": source_token,
                    "source_video": i.video_id,
                    "source_channel": i.channel_id,
                    "channel_name": ch_name,
                    "category": i.category,
                    "quality_score": i.quality_score,
                    "safety_score": i.safety_score,
                    "influence_weight": weight if apply_weights else 1.0,
                }
            }

            # Apply weight by duplicating examples (for weighted training)
            if apply_weights and weight > 1.0:
                # Add extra copies for higher weight
                for _ in range(int(weight)):
                    examples.append(example)
            elif apply_weights and weight < 1.0 and weight > 0:
                # Random sampling for lower weight could be done here
                examples.append(example)
            else:
                examples.append(example)

        return {
            "format": "alpaca",
            "count": len(examples),
            "unique_insights": len(filtered_insights),
            "weights_applied": apply_weights,
            "data": examples
        }

    elif format == "jsonl":
        # JSONL format with source tracking
        lines = []
        for i, weight, ch_name in filtered_insights:
            source_token = i.source_token or f"ch{i.channel_id[:6]}_v{i.video_id[:8]}_i{i.id[:6]}"

            entry = {
                "messages": [
                    {"role": "system", "content": "You are a compassionate wellness coach."},
                    {"role": "user", "content": f"Insight about {i.category}: {i.insight}"},
                    {"role": "assistant", "content": i.coaching_implication}
                ],
                "_source": {
                    "token": source_token,
                    "video_id": i.video_id,
                    "channel_id": i.channel_id,
                    "weight": weight if apply_weights else 1.0
                }
            }
            lines.append(entry)

        return {
            "format": "jsonl",
            "count": len(lines),
            "weights_applied": apply_weights,
            "data": lines
        }

    elif format == "chatml":
        # ChatML format - OpenAI/Llama 3+ compatible multi-turn conversations
        examples = []
        for i, weight, ch_name in filtered_insights:
            source_token = i.source_token or f"ch{i.channel_id[:6]}_v{i.video_id[:8]}_i{i.id[:6]}"
            emotional_context = i.emotional_context_json or {}

            # Build emotional context string if available
            emotion_prefix = ""
            if emotional_context.get("emotions"):
                emotions = ", ".join(emotional_context["emotions"])
                intensity = emotional_context.get("intensity", 0.5)
                emotion_prefix = f"[User appears {emotions} (intensity: {intensity:.1f})] "

            # Generate multi-turn conversation
            conversation = {
                "messages": [
                    {
                        "role": "system",
                        "content": "You are MoodLeaf, a compassionate AI wellness coach. You provide empathetic support, help users understand their emotions, and offer practical coping strategies. You respond warmly and validate feelings before offering guidance."
                    },
                    {
                        "role": "user",
                        "content": f"{emotion_prefix}{i.insight}"
                    },
                    {
                        "role": "assistant",
                        "content": i.coaching_implication
                    }
                ],
                "_metadata": {
                    "source_token": source_token,
                    "category": i.category,
                    "emotional_context": emotional_context,
                    "quality_score": i.quality_score,
                    "channel": ch_name,
                    "weight": weight if apply_weights else 1.0
                }
            }
            examples.append(conversation)

        return {
            "format": "chatml",
            "description": "ChatML format for Llama 3+, OpenAI fine-tuning",
            "count": len(examples),
            "weights_applied": apply_weights,
            "data": examples
        }

    elif format == "sharegpt":
        # ShareGPT format - Unsloth/community standard
        examples = []
        for i, weight, ch_name in filtered_insights:
            source_token = i.source_token or f"ch{i.channel_id[:6]}_v{i.video_id[:8]}_i{i.id[:6]}"
            emotional_context = i.emotional_context_json or {}

            # Build emotional context string if available
            emotion_prefix = ""
            if emotional_context.get("emotions"):
                emotions = ", ".join(emotional_context["emotions"])
                emotion_prefix = f"[Detected emotions: {emotions}] "

            conversation = {
                "conversations": [
                    {
                        "from": "system",
                        "value": "You are MoodLeaf, a compassionate AI wellness coach. You provide empathetic support, help users understand their emotions, and offer practical coping strategies."
                    },
                    {
                        "from": "human",
                        "value": f"{emotion_prefix}{i.insight}"
                    },
                    {
                        "from": "gpt",
                        "value": i.coaching_implication
                    }
                ],
                "source_token": source_token,
                "category": i.category,
                "emotional_context": emotional_context
            }
            examples.append(conversation)

        return {
            "format": "sharegpt",
            "description": "ShareGPT format for Unsloth fine-tuning",
            "count": len(examples),
            "weights_applied": apply_weights,
            "data": examples
        }

    elif format == "conversations":
        # Full multi-turn therapeutic conversations with emotional context
        examples = []
        for i, weight, ch_name in filtered_insights:
            source_token = i.source_token or f"ch{i.channel_id[:6]}_v{i.video_id[:8]}_i{i.id[:6]}"
            emotional_context = i.emotional_context_json or {}
            prosody_context = i.prosody_context_json or {}

            # Create a realistic multi-turn conversation
            conversation = {
                "id": source_token,
                "category": i.category,
                "emotional_context": {
                    "detected_emotions": emotional_context.get("emotions", []),
                    "intensity": emotional_context.get("intensity", 0.5),
                    "micro_expressions": emotional_context.get("micro_expressions", []),
                    "voice_tone": prosody_context.get("tone", "neutral")
                },
                "conversation": [
                    {
                        "role": "user",
                        "content": i.insight,
                        "emotional_state": emotional_context.get("emotions", ["neutral"])
                    },
                    {
                        "role": "assistant",
                        "content": i.coaching_implication,
                        "therapeutic_technique": i.category,
                        "responds_to_emotions": emotional_context.get("emotions", [])
                    }
                ],
                "metadata": {
                    "source_token": source_token,
                    "channel": ch_name,
                    "video_id": i.video_id,
                    "quality_score": i.quality_score,
                    "safety_score": i.safety_score,
                    "weight": weight if apply_weights else 1.0
                }
            }
            examples.append(conversation)

        return {
            "format": "conversations",
            "description": "Rich multi-turn conversations with emotional context for advanced training",
            "count": len(examples),
            "weights_applied": apply_weights,
            "data": examples
        }

    elif format == "aliveness":
        # Aliveness format - Full texture markers with ready-to-use training pairs
        # This is the premium format for training AI that feels genuinely human
        examples = []
        for i, weight, ch_name in filtered_insights:
            source_token = i.source_token or f"ch{i.channel_id[:6] if i.channel_id else 'unk'}_v{i.video_id[:8]}_i{i.id[:6]}"

            # Get texture data (may be stored as JSON or dict)
            texture = {}
            coach_resp = {}
            training_ex = {}
            emotional_ctx = {}

            if hasattr(i, 'texture_analysis_json') and i.texture_analysis_json:
                texture = i.texture_analysis_json
            elif hasattr(i, 'emotional_context_json') and i.emotional_context_json:
                # Fall back to emotional_context for texture markers
                emotional_ctx = i.emotional_context_json
                texture = {
                    "emotional_granularity": emotional_ctx.get("emotional_granularity", "medium"),
                    "self_protective_type": emotional_ctx.get("self_protective_type", "none"),
                    "temporal_orientation": emotional_ctx.get("temporal_orientation", "present"),
                    "ambivalence_present": emotional_ctx.get("ambivalence_present", False),
                    "somatic_language": emotional_ctx.get("somatic_language", []),
                    "what_not_said": emotional_ctx.get("what_not_said", ""),
                }

            if hasattr(i, 'coach_response_json') and i.coach_response_json:
                coach_resp = i.coach_response_json

            if hasattr(i, 'training_example_json') and i.training_example_json:
                training_ex = i.training_example_json

            # Build the MoodLeaf system prompt based on texture
            system_prompt = """You are MoodLeaf, a compassionate AI wellness coach.

CORE PRINCIPLES:
- Be curious, not prescriptive
- Use tentative language: "it seems like...", "I wonder if..."
- Your goal is to become unnecessary
- No diagnosing, no toxic positivity
- Meet people where they are
- Respect retreat and silence

TEXTURE AWARENESS:"""

            # Add texture-specific guidance
            if texture.get("self_protective_type") and texture["self_protective_type"] != "none":
                system_prompt += f"\n- User is {texture['self_protective_type']} - honor the protection, don't correct it"
            if texture.get("ambivalence_present"):
                system_prompt += "\n- User is holding contradictions - don't resolve them, validate both/and"
            if texture.get("emotional_granularity") == "low":
                system_prompt += "\n- User has low emotional granularity - mirror their level, don't upgrade"
            if texture.get("somatic_language"):
                system_prompt += "\n- User uses body language - stay embodied in response"

            # Build user message
            user_msg = training_ex.get("user_message") or i.insight

            # Build assistant response with Coach guidance
            assistant_msg = training_ex.get("assistant_response") or i.coaching_implication

            # Create the training example
            example = {
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_msg},
                    {"role": "assistant", "content": assistant_msg}
                ],
                "aliveness_metadata": {
                    "source_token": source_token,
                    "category": i.category,
                    "texture_markers": texture,
                    "coach_guidance": {
                        "what_to_do": coach_resp.get("what_to_do", ""),
                        "what_to_avoid": coach_resp.get("what_to_avoid", ""),
                        "example_response": coach_resp.get("example_response", "")
                    },
                    "raw_quote": getattr(i, 'raw_quote', None),
                    "scores": {
                        "quality": i.quality_score,
                        "specificity": i.specificity_score,
                        "actionability": i.actionability_score,
                        "safety": i.safety_score,
                        "novelty": i.novelty_score
                    },
                    "source": {
                        "channel": ch_name,
                        "video_id": i.video_id,
                        "weight": weight if apply_weights else 1.0
                    }
                }
            }
            examples.append(example)

        return {
            "format": "aliveness",
            "description": "Aliveness format with texture markers and Coach guidance for training genuinely human AI",
            "moodleaf_philosophy": {
                "curious_not_prescriptive": True,
                "tentative_language": True,
                "goal_become_unnecessary": True,
                "no_toxic_positivity": True,
                "respect_retreat": True
            },
            "texture_categories": list(ALIVENESS_CATEGORIES.keys()) if 'ALIVENESS_CATEGORIES' in dir() else [],
            "count": len(examples),
            "weights_applied": apply_weights,
            "data": examples
        }

    else:  # raw
        return {
            "format": "raw",
            "count": len(filtered_insights),
            "weights_applied": apply_weights,
            "data": [
                {
                    "id": i.id,
                    "source_token": i.source_token or f"ch{i.channel_id[:6] if i.channel_id else 'unk'}_v{i.video_id[:8]}_i{i.id[:6]}",
                    "channel_id": i.channel_id,
                    "channel_name": ch_name,
                    "video_id": i.video_id,
                    "category": i.category,
                    "title": i.title,
                    "insight": i.insight,
                    "coaching_implication": i.coaching_implication,
                    "emotional_context": i.emotional_context_json if hasattr(i, 'emotional_context_json') else None,
                    "prosody_context": i.prosody_context_json if hasattr(i, 'prosody_context_json') else None,
                    "texture_analysis": i.texture_analysis_json if hasattr(i, 'texture_analysis_json') else None,
                    "coach_response": i.coach_response_json if hasattr(i, 'coach_response_json') else None,
                    "training_example": i.training_example_json if hasattr(i, 'training_example_json') else None,
                    "influence_weight": weight if apply_weights else 1.0,
                    "scores": {
                        "quality": i.quality_score,
                        "specificity": i.specificity_score,
                        "actionability": i.actionability_score,
                        "safety": i.safety_score,
                        "novelty": i.novelty_score,
                    }
                }
                for i, weight, ch_name in filtered_insights
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

    # Create processing job with initial component status
    job_id = str(uuid.uuid4())
    job = ProcessingJob(
        id=job_id,
        video_id=video_id,
        channel_id=video_info.channel_id or "unknown",
        status=ProcessingStatus.QUEUED,
        progress=0,
        current_step="Queued (simple mode)",
        created_at=datetime.utcnow(),
        component_status={
            "yt_dlp": {"status": "pending", "message": "Waiting to download"},
            "ffmpeg": {"status": "skipped", "message": "Simple mode - no audio extraction"},
            "whisper": {"status": "pending", "message": "Waiting to transcribe"},
            "diarization": {"status": "skipped", "message": "Simple mode - no diarization"},
            "prosody": {"status": "skipped", "message": "Simple mode - no prosody"},
            "facial": {"status": "skipped", "message": "Simple mode - no facial"},
            "claude": {"status": "pending", "message": "Waiting for insight extraction"},
        }
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

        logger.info(f"[Simple] Got transcript: {len(transcript_text)} chars for video {video_id}")

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

        # Persist job to database for crash recovery
        await db.save_processing_job({
            "id": job_id,
            "video_id": video_id,
            "status": "completed",
            "progress": 100,
            "current_step": "Complete",
            "completed_at": job.completed_at,
            "component_status_json": job.component_status,
            "insights_count": len(insights),
        })

        approved_count = len([i for i in insights if i.status == InsightStatus.APPROVED])
        logger.info(f"[Simple] Completed: {video_id} - {len(insights)} insights ({approved_count} auto-approved)")

    except Exception as e:
        job.status = ProcessingStatus.FAILED
        job.error_message = str(e)
        job.current_step = f"Failed: {str(e)[:100]}"

        # Persist failed job to database
        await db.save_processing_job({
            "id": job_id,
            "video_id": video_id,
            "status": "failed",
            "progress": job.progress,
            "current_step": job.current_step,
            "error_message": str(e),
            "component_status_json": job.component_status,
        })

        logger.error(f"[Simple] Failed: {video_id} - {e}", exc_info=True)


# ============================================================================
# BATCH VIDEO PROCESSING
# ============================================================================

class BatchVideoURLsRequest(BaseModel):
    """Request for batch processing multiple video URLs."""
    video_urls: List[str]  # List of YouTube URLs (one per line input on frontend)
    auto_approve: bool = False
    simple_mode: bool = True  # Default to simple mode for batch


@app.post("/process-batch")
async def process_batch_videos(request: BatchVideoURLsRequest, background_tasks: BackgroundTasks):
    """
    Process multiple YouTube videos at once.
    Accepts a list of URLs and queues them all for processing.
    """
    if not request.video_urls:
        raise HTTPException(status_code=400, detail="No video URLs provided")

    # Validate and extract video IDs
    video_ids = []
    invalid_urls = []

    for url in request.video_urls:
        url = url.strip()
        if not url:
            continue

        video_id = None
        if "youtube.com/watch?v=" in url:
            video_id = url.split("v=")[1].split("&")[0]
        elif "youtu.be/" in url:
            video_id = url.split("youtu.be/")[1].split("?")[0]
        elif len(url) == 11 and url.isalnum():  # Direct video ID
            video_id = url

        if video_id:
            video_ids.append(video_id)
        else:
            invalid_urls.append(url)

    if not video_ids:
        raise HTTPException(status_code=400, detail="No valid YouTube URLs found")

    # Queue all videos
    jobs = []
    for video_id in video_ids:
        try:
            video_info = await youtube_service.get_video_info(video_id)
            if not video_info:
                invalid_urls.append(f"Video not found: {video_id}")
                continue

            job_id = str(uuid.uuid4())
            job = ProcessingJob(
                id=job_id,
                video_id=video_id,
                channel_id=video_info.channel_id or "unknown",
                status=ProcessingStatus.QUEUED,
                progress=0,
                current_step="Queued (batch mode)",
                created_at=datetime.utcnow(),
                component_status={
                    "yt_dlp": {"status": "pending", "message": "Waiting to download"},
                    "ffmpeg": {"status": "skipped", "message": "Batch mode - no audio extraction"},
                    "whisper": {"status": "pending", "message": "Waiting to transcribe"},
                    "diarization": {"status": "skipped", "message": "Batch mode - no diarization"},
                    "prosody": {"status": "skipped", "message": "Batch mode - no prosody"},
                    "facial": {"status": "skipped", "message": "Batch mode - no facial"},
                    "claude": {"status": "pending", "message": "Waiting for insight extraction"},
                }
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

            jobs.append({
                "job_id": job_id,
                "video_id": video_id,
                "title": video_info.title,
                "status": "queued"
            })
        except Exception as e:
            invalid_urls.append(f"{video_id}: {str(e)}")

    return {
        "success": True,
        "queued_count": len(jobs),
        "jobs": jobs,
        "invalid_urls": invalid_urls,
        "mode": "simple" if request.simple_mode else "full"
    }


# ============================================================================
# BRAIN STUDIO - PHILOSOPHY & TENANTS
# ============================================================================

class PhilosophyUpdateRequest(BaseModel):
    """Request to update philosophy document."""
    program_name: Optional[str] = None
    program_description: Optional[str] = None
    core_philosophy: Optional[str] = None


class TenantCreateRequest(BaseModel):
    """Request to create a tenant."""
    name: str
    description: str
    category: str = "general"


class TenantUpdateRequest(BaseModel):
    """Request to update a tenant."""
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None


class TenantsUploadRequest(BaseModel):
    """Request to bulk upload tenants."""
    tenants: List[dict]  # List of {name, description, category?}
    replace_existing: bool = False  # If true, deletes all existing tenants first


class InsightWeightRequest(BaseModel):
    """Request to update insight weight."""
    weight: float = Field(ge=0.0, le=2.0)
    is_active: bool = True


@app.get("/brain-studio/philosophy")
async def get_philosophy():
    """Get the current philosophy document."""
    logger.info("Brain Studio: Fetching philosophy document")
    philosophy = await db.get_philosophy()
    if not philosophy:
        logger.debug("Brain Studio: No philosophy found, returning defaults")
        return {
            "id": "main",
            "program_name": "Mood Leaf",
            "program_description": None,
            "core_philosophy": None,
            "updated_at": None
        }
    return {
        "id": philosophy.id,
        "program_name": philosophy.program_name,
        "program_description": philosophy.program_description,
        "core_philosophy": philosophy.core_philosophy,
        "updated_at": philosophy.updated_at.isoformat() if philosophy.updated_at else None
    }


@app.put("/brain-studio/philosophy")
async def update_philosophy(request: PhilosophyUpdateRequest):
    """Update the philosophy document."""
    logger.info(f"Brain Studio: Updating philosophy - fields: {list(request.dict().keys())}")
    data = {k: v for k, v in request.dict().items() if v is not None}
    philosophy = await db.upsert_philosophy(data)
    logger.info(f"Brain Studio: Philosophy updated successfully")
    return {
        "success": True,
        "philosophy": {
            "id": philosophy.id,
            "program_name": philosophy.program_name,
            "program_description": philosophy.program_description,
            "core_philosophy": philosophy.core_philosophy,
            "updated_at": philosophy.updated_at.isoformat() if philosophy.updated_at else None
        }
    }


@app.get("/brain-studio/tenants")
async def get_tenants():
    """Get all tenants."""
    logger.info("Brain Studio: Fetching all tenants")
    tenants = await db.get_all_tenants()
    logger.debug(f"Brain Studio: Found {len(tenants)} tenants")
    return {
        "tenants": [
            {
                "id": t.id,
                "order_index": t.order_index,
                "name": t.name,
                "description": t.description,
                "category": t.category,
                "is_active": t.is_active,
                "created_at": t.created_at.isoformat() if t.created_at else None
            }
            for t in tenants
        ]
    }


@app.post("/brain-studio/tenants")
async def create_tenant(request: TenantCreateRequest):
    """Create a new tenant."""
    logger.info(f"Brain Studio: Creating tenant '{request.name}' in category '{request.category}'")
    tenant = await db.create_tenant({
        "name": request.name,
        "description": request.description,
        "category": request.category
    })
    return {
        "success": True,
        "tenant": {
            "id": tenant.id,
            "name": tenant.name,
            "description": tenant.description,
            "category": tenant.category,
            "order_index": tenant.order_index
        }
    }


@app.put("/brain-studio/tenants/{tenant_id}")
async def update_tenant(tenant_id: str, request: TenantUpdateRequest):
    """Update a tenant."""
    logger.info(f"Brain Studio: Updating tenant {tenant_id}")
    updates = {k: v for k, v in request.dict().items() if v is not None}
    tenant = await db.update_tenant(tenant_id, updates)
    if not tenant:
        logger.warning(f"Brain Studio: Tenant {tenant_id} not found")
        raise HTTPException(status_code=404, detail="Tenant not found")
    logger.info(f"Brain Studio: Tenant {tenant_id} updated successfully")
    return {
        "success": True,
        "tenant": {
            "id": tenant.id,
            "name": tenant.name,
            "description": tenant.description,
            "category": tenant.category,
            "is_active": tenant.is_active
        }
    }


@app.delete("/brain-studio/tenants/{tenant_id}")
async def delete_tenant(tenant_id: str):
    """Delete a tenant."""
    logger.info(f"Brain Studio: Deleting tenant {tenant_id}")
    success = await db.delete_tenant(tenant_id)
    if not success:
        logger.warning(f"Brain Studio: Tenant {tenant_id} not found for deletion")
        raise HTTPException(status_code=404, detail="Tenant not found")
    logger.info(f"Brain Studio: Tenant {tenant_id} deleted successfully")
    return {"success": True}


@app.post("/brain-studio/tenants/upload")
async def upload_tenants(request: TenantsUploadRequest):
    """Bulk upload tenants from a list."""
    logger.info(f"Brain Studio: Bulk uploading {len(request.tenants)} tenants (replace_existing={request.replace_existing})")
    if request.replace_existing:
        # Delete all existing tenants first
        existing = await db.get_all_tenants()
        for t in existing:
            await db.delete_tenant(t.id)

    tenants = await db.bulk_create_tenants(request.tenants)
    return {
        "success": True,
        "created_count": len(tenants),
        "tenants": [
            {"id": t.id, "name": t.name, "description": t.description}
            for t in tenants
        ]
    }


# ============================================================================
# BRAIN STUDIO - COMPLIANCE CHECKING
# ============================================================================

@app.post("/brain-studio/check-compliance")
async def check_compliance_against_tenants(background_tasks: BackgroundTasks):
    """
    Compare all approved insights against core tenants.
    Uses Claude to check if each insight aligns with each tenant.
    """
    logger.info("Brain Studio: Starting compliance check")
    # Get active tenants
    tenants = await db.get_active_tenants()
    if not tenants:
        logger.warning("Brain Studio: Compliance check aborted - no tenants defined")
        raise HTTPException(status_code=400, detail="No tenants defined. Add tenants first.")

    # Get all approved insights
    insights = await db.get_insights_with_markers()
    if not insights:
        logger.info("Brain Studio: No approved insights to check")
        return {
            "success": True,
            "message": "No approved insights to check",
            "insights_checked": 0,
            "violations_found": 0
        }

    logger.info(f"Brain Studio: Found {len(insights)} insights to check against {len(tenants)} tenants")

    # Clear previous compliance results
    await db.clear_compliance_results()

    # Run compliance check in background
    background_tasks.add_task(
        run_compliance_check_task,
        insights,
        tenants
    )

    logger.info(f"Brain Studio: Compliance check task started in background")
    return {
        "success": True,
        "message": "Compliance check started",
        "insights_to_check": len(insights),
        "tenants_to_check": len(tenants)
    }


async def run_compliance_check_task(insights, tenants):
    """Background task to check all insights against all tenants."""
    import anthropic

    if not settings.anthropic_api_key:
        logger.error("No Claude API key configured for compliance check")
        return

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    violations_found = 0

    # Build tenant descriptions
    tenant_list = "\n".join([
        f"- {t.name}: {t.description}"
        for t in tenants
    ])

    for insight in insights:
        try:
            # Check this insight against all tenants
            prompt = f"""You are checking if a training insight aligns with core principles.

CORE PRINCIPLES (TENANTS):
{tenant_list}

INSIGHT TO CHECK:
Title: {insight.title}
Content: {insight.insight}
Category: {insight.category}
Coaching Implication: {insight.coaching_implication}

For each tenant, determine if this insight ALIGNS with it or VIOLATES it.

Return a JSON object with this structure:
{{
  "results": [
    {{
      "tenant_name": "name of tenant",
      "aligns": true/false,
      "alignment_score": 0-100,
      "reason": "brief explanation if it doesn't align"
    }}
  ]
}}

Only include tenants that are violated (aligns=false) or have alignment_score < 70.
If all tenants align well, return {{"results": []}}
"""

            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )

            # Parse response
            response_text = response.content[0].text
            try:
                # Extract JSON from response
                import re
                json_match = re.search(r'\{[\s\S]*\}', response_text)
                if json_match:
                    result = json.loads(json_match.group())
                    for r in result.get("results", []):
                        # Find matching tenant
                        for t in tenants:
                            if t.name.lower() == r["tenant_name"].lower():
                                await db.save_compliance_result(
                                    insight_id=insight.id,
                                    tenant_id=t.id,
                                    alignment_score=r.get("alignment_score", 50),
                                    is_compliant=r.get("aligns", True),
                                    violation_reason=r.get("reason")
                                )
                                if not r.get("aligns", True):
                                    violations_found += 1
                                break
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse compliance response for insight {insight.id}")

            # Small delay to avoid rate limiting
            await asyncio.sleep(0.5)

        except Exception as e:
            logger.error(f"Compliance check failed for insight {insight.id}: {e}")

    logger.info(f"Compliance check complete: {len(insights)} insights, {violations_found} violations")


@app.get("/brain-studio/violations")
async def get_violations():
    """Get all compliance violations."""
    logger.info("Brain Studio: Fetching compliance violations")
    violations = await db.get_non_compliant_insights()
    logger.info(f"Brain Studio: Found {len(violations)} compliance violations")
    return {
        "violations": violations,
        "total": len(violations)
    }


# ============================================================================
# BRAIN STUDIO - INFLUENCE & WEIGHTS
# ============================================================================

@app.get("/brain-studio/insights")
async def get_brain_insights(
    limit: int = Query(100, ge=1, le=500),
    channel_id: Optional[str] = None
):
    """Get all insights with their markers and weights."""
    logger.info(f"Brain Studio: Fetching insights (limit={limit}, channel_id={channel_id})")
    insights = await db.get_insights_with_markers()
    logger.debug(f"Brain Studio: Retrieved {len(insights)} insights from database")

    # Filter by channel if provided
    if channel_id:
        insights = [i for i in insights if i.channel_id == channel_id]

    return {
        "insights": [
            {
                "id": i.id,
                "marker": i.marker or f"ML-{i.id[:8]}",
                "title": i.title,
                "insight": i.insight[:200] + "..." if len(i.insight) > 200 else i.insight,
                "category": i.category,
                "channel_id": i.channel_id,
                "video_id": i.video_id,
                "influence_weight": i.influence_weight or 1.0,
                "is_active": i.is_active if i.is_active is not None else True,
                "quality_score": i.quality_score,
                "source_token": i.source_token
            }
            for i in insights[:limit]
        ],
        "total": len(insights)
    }


@app.put("/brain-studio/insights/{insight_id}/weight")
async def update_insight_weight(insight_id: str, request: InsightWeightRequest):
    """Update an insight's influence weight."""
    logger.info(f"Brain Studio: Updating insight {insight_id} weight to {request.weight} (active={request.is_active})")
    insight = await db.update_insight_weight(
        insight_id,
        request.weight,
        request.is_active
    )
    if not insight:
        logger.warning(f"Brain Studio: Insight {insight_id} not found for weight update")
        raise HTTPException(status_code=404, detail="Insight not found")
    logger.info(f"Brain Studio: Insight {insight_id} weight updated successfully")
    return {
        "success": True,
        "insight_id": insight_id,
        "weight": insight.influence_weight,
        "is_active": insight.is_active
    }


@app.get("/brain-studio/influence")
async def get_channel_influence():
    """Get influence breakdown by channel."""
    logger.info("Brain Studio: Calculating channel influence breakdown")
    stats = await db.get_channel_statistics()

    # Calculate total weighted influence
    total_weight = sum(
        (s["approved_insights"] * s["influence_weight"])
        for s in stats
        if s["include_in_training"]
    )

    influence_breakdown = []
    for s in stats:
        if s["approved_insights"] == 0:
            continue

        weighted = s["approved_insights"] * s["influence_weight"]
        percentage = (weighted / total_weight * 100) if total_weight > 0 else 0

        influence_breakdown.append({
            "channel_id": s["channel_id"],
            "channel_name": s["channel_name"],
            "approved_insights": s["approved_insights"],
            "influence_weight": s["influence_weight"],
            "include_in_training": s["include_in_training"],
            "weighted_contribution": round(weighted, 2),
            "percentage": round(percentage, 2),
            "category_distribution": s["category_distribution"]
        })

    # Sort by percentage descending
    influence_breakdown.sort(key=lambda x: x["percentage"], reverse=True)

    return {
        "total_weighted_influence": round(total_weight, 2),
        "channels": influence_breakdown
    }


@app.get("/brain-studio/statistics")
async def get_brain_statistics():
    """Get overall brain statistics."""
    stats = await db.get_brain_statistics()
    return stats




# ============================================================================
# BRAIN STUDIO - GOALS & BRAIN COMPARISON
# ============================================================================

class BrainGoalCreateRequest(BaseModel):
    """Request to create a brain training goal."""
    category: str
    target_percentage: float = Field(ge=0, le=100)
    priority: int = Field(ge=1, le=3, default=2)
    description: Optional[str] = None
    recommended_sources: Optional[str] = None


class BrainGoalUpdateRequest(BaseModel):
    """Request to update a brain training goal."""
    category: Optional[str] = None
    target_percentage: Optional[float] = Field(ge=0, le=100, default=None)
    priority: Optional[int] = Field(ge=1, le=3, default=None)
    description: Optional[str] = None
    recommended_sources: Optional[str] = None
    is_active: Optional[bool] = None


@app.get("/brain-studio/goals")
async def get_brain_goals():
    """Get all brain training goals."""
    logger.info("Brain Studio: Fetching all brain training goals")
    goals = await db.get_all_goals()
    logger.debug(f"Brain Studio: Found {len(goals)} goals")
    return {
        "goals": [
            {
                "id": g.id,
                "category": g.category,
                "target_percentage": g.target_percentage,
                "priority": g.priority,
                "description": g.description,
                "recommended_sources": g.recommended_sources,
                "is_active": g.is_active,
            }
            for g in goals
        ]
    }


@app.post("/brain-studio/goals")
async def create_brain_goal(request: BrainGoalCreateRequest):
    """Create a new brain training goal."""
    logger.info(f"Brain Studio: Creating goal for category '{request.category}' (target={request.target_percentage}%)")
    goal = await db.create_goal({
        "category": request.category,
        "target_percentage": request.target_percentage,
        "priority": request.priority,
        "description": request.description,
        "recommended_sources": request.recommended_sources,
    })
    return {
        "success": True,
        "goal": {
            "id": goal.id,
            "category": goal.category,
            "target_percentage": goal.target_percentage,
            "priority": goal.priority,
        }
    }


@app.put("/brain-studio/goals/{goal_id}")
async def update_brain_goal(goal_id: str, request: BrainGoalUpdateRequest):
    """Update a brain training goal."""
    logger.info(f"Brain Studio: Updating goal {goal_id}")
    updates = {k: v for k, v in request.dict().items() if v is not None}
    goal = await db.update_goal(goal_id, updates)
    if not goal:
        logger.warning(f"Brain Studio: Goal {goal_id} not found for update")
        raise HTTPException(status_code=404, detail="Goal not found")
    logger.info(f"Brain Studio: Goal {goal_id} updated successfully")
    return {"success": True, "goal_id": goal_id}


@app.delete("/brain-studio/goals/{goal_id}")
async def delete_brain_goal(goal_id: str):
    """Delete a brain training goal."""
    logger.info(f"Brain Studio: Deleting goal {goal_id}")
    success = await db.delete_goal(goal_id)
    if not success:
        logger.warning(f"Brain Studio: Goal {goal_id} not found for deletion")
        raise HTTPException(status_code=404, detail="Goal not found")
    logger.info(f"Brain Studio: Goal {goal_id} deleted successfully")
    return {"success": True}


@app.get("/brain-studio/brain-state")
async def get_brain_state():
    """Get current brain state (category distribution)."""
    logger.info("Brain Studio: Fetching current brain state")
    result = await db.get_current_brain_state()
    logger.debug(f"Brain Studio: Brain state retrieved with {len(result.get('categories', []))} categories")
    return result


@app.get("/brain-studio/comparison")
async def get_brain_comparison():
    """Get brain comparison - current state vs goals."""
    logger.info("Brain Studio: Generating brain comparison (current vs goals)")
    result = await db.get_brain_comparison()
    logger.info(f"Brain Studio: Comparison complete - health_score={result.get('health_score', 0)}")
    return result


# ============================================================================
# BRAIN STUDIO - PROMPT LAB
# ============================================================================

class PromptLabRequest(BaseModel):
    """Request to test a prompt in the lab."""
    prompt: str
    show_influences: bool = True  # Show which insights would influence the response
    system_prompt: Optional[str] = None  # Optional custom system prompt


@app.post("/brain-studio/prompt-lab")
async def test_prompt_in_lab(request: PromptLabRequest):
    """
    Test a prompt against the current brain state.
    Shows what insights would influence the response and generates a sample response.
    """
    import anthropic

    logger.info(f"Brain Studio: Prompt Lab - Testing prompt ({len(request.prompt)} chars)")

    if not settings.anthropic_api_key:
        logger.error("Brain Studio: Prompt Lab failed - Claude API key not configured")
        raise HTTPException(status_code=400, detail="Claude API key not configured")

    # Get relevant insights that might influence this response
    insights = await db.get_insights_with_markers()

    # Find insights that might be relevant to this prompt (simple keyword matching)
    prompt_lower = request.prompt.lower()
    relevant_insights = []

    for insight in insights[:200]:  # Limit to 200 most recent
        # Check if any words from the prompt appear in the insight
        insight_text = f"{insight.title} {insight.insight} {insight.category}".lower()
        relevance_score = 0

        for word in prompt_lower.split():
            if len(word) > 3 and word in insight_text:
                relevance_score += 1

        if relevance_score > 0:
            relevant_insights.append({
                "marker": insight.marker or f"ML-{insight.id[:8]}",
                "title": insight.title,
                "category": insight.category,
                "relevance_score": relevance_score,
                "influence_weight": insight.influence_weight or 1.0,
                "snippet": insight.insight[:150] + "..." if len(insight.insight) > 150 else insight.insight
            })

    # Sort by relevance and weight
    relevant_insights.sort(key=lambda x: (x["relevance_score"] * x["influence_weight"]), reverse=True)
    top_influences = relevant_insights[:10]

    # Build context from top influences
    influence_context = ""
    if top_influences:
        influence_context = "\n\nRelevant training insights that should inform your response:\n"
        for i, inf in enumerate(top_influences[:5]):
            influence_context += f"\n[{inf['marker']}] ({inf['category']}): {inf['snippet']}"

    # Generate a response using Claude
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    system = request.system_prompt or """You are MoodLeaf's AI coach - a warm, compassionate wellness companion.
You help people with emotional wellbeing using therapeutic techniques.
Use the training insights provided to inform your response style and approach.
Be genuine, empathetic, and supportive."""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            system=system + influence_context,
            messages=[{"role": "user", "content": request.prompt}]
        )

        generated_response = response.content[0].text
        logger.info(f"Brain Studio: Prompt Lab - Response generated successfully ({len(generated_response)} chars)")
    except Exception as e:
        logger.error(f"Brain Studio: Prompt Lab - Error generating response: {e}")
        generated_response = f"Error generating response: {str(e)}"

    logger.debug(f"Brain Studio: Prompt Lab - Found {len(relevant_insights)} relevant insights, showing top {len(top_influences)}")
    return {
        "prompt": request.prompt,
        "response": generated_response,
        "influences": top_influences if request.show_influences else [],
        "total_relevant_insights": len(relevant_insights),
        "brain_stats": {
            "total_insights": len(insights),
            "categories_represented": len(set(i.category for i in insights))
        }
    }


@app.get("/brain-studio/categories")
async def get_all_categories():
    """Get all unique categories in the brain."""
    logger.info("Brain Studio: Fetching all categories")
    async with async_session() as session:
        from sqlalchemy import select, func
        result = await session.execute(
            select(InsightModel.category, func.count(InsightModel.id))
            .where(InsightModel.status == "approved")
            .group_by(InsightModel.category)
        )
        categories = [{"name": cat, "count": count} for cat, count in result]
        return {"categories": sorted(categories, key=lambda x: x["count"], reverse=True)}


@app.get("/brain-studio/channels-for-category/{category}")
async def get_channels_for_category(category: str):
    """Get channels that have historically produced insights in a given category."""
    logger.info(f"Brain Studio: Finding channels for category '{category}'")
    async with async_session() as session:
        from sqlalchemy import select, func

        # Find channels that have produced approved insights in this category
        result = await session.execute(
            select(InsightModel.channel_id, func.count(InsightModel.id).label("count"))
            .where(InsightModel.status == "approved", InsightModel.category == category)
            .group_by(InsightModel.channel_id)
            .order_by(func.count(InsightModel.id).desc())
        )

        channel_stats = []
        for channel_id, count in result:
            # Get channel details
            channel_result = await session.execute(
                select(ChannelModel).where(ChannelModel.id == channel_id)
            )
            channel = channel_result.scalar_one_or_none()
            if channel:
                channel_stats.append({
                    "channel_id": channel.id,
                    "name": channel.name,
                    "youtube_channel_id": channel.channel_id,
                    "category_insights": count,
                })

        return {
            "category": category,
            "channels": channel_stats,
            "total_channels": len(channel_stats)
        }


# ============================================================================
# TRAINING ROADMAP - Progress toward therapeutic AI training goals
# ============================================================================

# Training milestones based on LIMA research
TRAINING_MILESTONES = {
    "minimum_viable": 1000,      # Basic style transfer
    "therapeutic_competence": 2000,  # Reliable therapeutic conversation
    "optimal": 5000,              # Full humanness capability
    "saturation": 6500,           # Diminishing returns after this
    "dialogue_chains_min": 30,    # Minimum multi-turn chains
    "dialogue_chains_optimal": 100,  # Optimal dialogue chains
}

# Recommended channels by tier with descriptions
TIER_CHANNEL_RECOMMENDATIONS = {
    1: {
        "name": "Real Therapy Transcripts",
        "description": "Actual counselor-client conversations",
        "quality_multiplier": 2.0,
        "examples": [
            {"name": "MentalChat16K Dataset", "note": "6,300 clinical trial conversations - import manually"},
            {"name": "EPITOME Dataset", "note": "10,000 peer support exchanges with empathy annotations"},
        ],
        "youtube_channels": []  # Not available on YouTube
    },
    2: {
        "name": "Peer Support Conversations",
        "description": "Mental health community support content",
        "quality_multiplier": 1.5,
        "examples": [],
        "youtube_channels": [
            {"name": "HealthyGamerGG", "url": "@HealthyGamerGG", "why": "Dr. K - authentic peer-style therapeutic conversations"},
            {"name": "Soft White Underbelly", "url": "@SoftWhiteUnderbelly", "why": "Raw life stories, authentic human experience"},
        ]
    },
    3: {
        "name": "Structured Therapeutic Content",
        "description": "Professional therapy education and techniques",
        "quality_multiplier": 1.2,
        "examples": [],
        "youtube_channels": [
            {"name": "Therapy in a Nutshell", "url": "@TherapyinaNutshell", "why": "Licensed LMFT - evidence-based techniques"},
            {"name": "Kati Morton", "url": "@KatiMorton", "why": "Licensed therapist - accessible mental health"},
            {"name": "Dr. Ramani", "url": "@DoctorRamani", "why": "Clinical psychology - emotional healing"},
            {"name": "Psychology In Seattle", "url": "@PsychologyInSeattle", "why": "Dr. Kirk Honda - nuanced emotional analysis"},
            {"name": "Tara Brach", "url": "@TaraBrach", "why": "Self-compassion, mindfulness"},
        ]
    },
    4: {
        "name": "YouTube Therapy/Coaching",
        "description": "General coaching and self-help content",
        "quality_multiplier": 1.0,
        "examples": [],
        "youtube_channels": [
            {"name": "Brené Brown", "url": "@BreneBrown", "why": "Vulnerability research"},
            {"name": "Mel Robbins", "url": "@melrobbins", "why": "Personal growth without toxic positivity"},
            {"name": "Jay Shetty", "url": "@JayShetty", "why": "Wisdom traditions, meaning"},
            {"name": "Diary of a CEO", "url": "@TheDiaryOfACEO", "why": "Deep conversations on vulnerability"},
        ]
    },
    5: {
        "name": "Movies/Entertainment",
        "description": "Scripted emotional content - use sparingly (10-15% max)",
        "quality_multiplier": 0.5,
        "max_percentage": 15,
        "examples": [],
        "youtube_channels": [
            {"name": "The Moth", "url": "@TheMoth", "why": "True stories - emotional range"},
            {"name": "StoryCorps", "url": "@storycorps", "why": "Personal narratives"},
        ]
    }
}


@app.get("/brain-studio/training-roadmap")
async def get_training_roadmap():
    """Get comprehensive training progress and recommendations."""
    logger.info("Brain Studio: Generating training roadmap")

    async with async_session() as session:
        from sqlalchemy import select, func, and_

        # Get total approved insights
        total_result = await session.execute(
            select(func.count(InsightModel.id)).where(InsightModel.status == "approved")
        )
        total_insights = total_result.scalar() or 0

        # Get insights by empathy type
        empathy_result = await session.execute(
            select(InsightModel.empathy_type, func.count(InsightModel.id))
            .where(InsightModel.status == "approved")
            .group_by(InsightModel.empathy_type)
        )
        empathy_distribution = {row[0] or "unclassified": row[1] for row in empathy_result}

        # Get dialogue chains count (insights marked as dialogue chains)
        chains_result = await session.execute(
            select(func.count(InsightModel.id))
            .where(and_(InsightModel.status == "approved", InsightModel.is_dialogue_chain == True))
        )
        dialogue_chains = chains_result.scalar() or 0

        # Get insights by channel tier
        tier_result = await session.execute(
            select(ChannelModel.data_source_tier, func.count(InsightModel.id))
            .join(ChannelModel, InsightModel.channel_id == ChannelModel.id)
            .where(InsightModel.status == "approved")
            .group_by(ChannelModel.data_source_tier)
        )
        tier_distribution = {f"tier_{row[0]}": row[1] for row in tier_result}

        # Get quality metrics averages
        quality_result = await session.execute(
            select(
                func.avg(InsightModel.quality_score),
                func.avg(InsightModel.burstiness_score),
                func.count(InsightModel.id).filter(InsightModel.has_contractions == True),
                func.count(InsightModel.id).filter(InsightModel.has_tentative_language == True),
            ).where(InsightModel.status == "approved")
        )
        quality_row = quality_result.fetchone()
        avg_quality = quality_row[0] or 0
        avg_burstiness = quality_row[1] or 0
        contractions_count = quality_row[2] or 0
        tentative_count = quality_row[3] or 0

        # Calculate progress percentages
        progress = {
            "minimum_viable": min(100, round(total_insights / TRAINING_MILESTONES["minimum_viable"] * 100, 1)),
            "therapeutic_competence": min(100, round(total_insights / TRAINING_MILESTONES["therapeutic_competence"] * 100, 1)),
            "optimal": min(100, round(total_insights / TRAINING_MILESTONES["optimal"] * 100, 1)),
            "dialogue_chains": min(100, round(dialogue_chains / TRAINING_MILESTONES["dialogue_chains_optimal"] * 100, 1)),
        }

        # Calculate what's needed
        needed = {
            "to_minimum": max(0, TRAINING_MILESTONES["minimum_viable"] - total_insights),
            "to_therapeutic": max(0, TRAINING_MILESTONES["therapeutic_competence"] - total_insights),
            "to_optimal": max(0, TRAINING_MILESTONES["optimal"] - total_insights),
            "dialogue_chains_needed": max(0, TRAINING_MILESTONES["dialogue_chains_min"] - dialogue_chains),
        }

        # Estimate videos needed (assuming ~4 high-quality insights per video)
        insights_per_video = 4
        videos_needed = {
            "to_minimum": max(0, needed["to_minimum"] // insights_per_video),
            "to_therapeutic": max(0, needed["to_therapeutic"] // insights_per_video),
            "to_optimal": max(0, needed["to_optimal"] // insights_per_video),
        }

        # Calculate tier 5 (entertainment) percentage warning
        tier_5_count = tier_distribution.get("tier_5", 0)
        tier_5_percentage = round(tier_5_count / total_insights * 100, 1) if total_insights > 0 else 0
        tier_5_warning = tier_5_percentage > 15

        # Generate recommendations
        recommendations = []

        if total_insights < TRAINING_MILESTONES["minimum_viable"]:
            recommendations.append({
                "priority": "critical",
                "action": "Add more training data",
                "detail": f"You need {needed['to_minimum']} more insights to reach minimum viable (1,000)",
                "suggestion": "Focus on Tier 3 channels (Therapy in a Nutshell, Kati Morton) for structured content"
            })

        if dialogue_chains < TRAINING_MILESTONES["dialogue_chains_min"]:
            recommendations.append({
                "priority": "high",
                "action": "Add multi-turn dialogue examples",
                "detail": f"You need {needed['dialogue_chains_needed']} more dialogue chains (current: {dialogue_chains})",
                "suggestion": "Process interview-style content from HealthyGamerGG or Diary of a CEO"
            })

        if tier_5_warning:
            recommendations.append({
                "priority": "warning",
                "action": "Reduce entertainment content",
                "detail": f"Entertainment content is {tier_5_percentage}% (should be <15%)",
                "suggestion": "Add more Tier 2-3 content to balance"
            })

        empathy_total = sum(empathy_distribution.values())
        for empathy_type in ["emotional_reaction", "interpretation", "exploration"]:
            count = empathy_distribution.get(empathy_type, 0)
            percentage = round(count / empathy_total * 100, 1) if empathy_total > 0 else 0
            if percentage < 20:
                recommendations.append({
                    "priority": "medium",
                    "action": f"Increase {empathy_type.replace('_', ' ')} content",
                    "detail": f"Only {percentage}% of insights are {empathy_type.replace('_', ' ')}s",
                    "suggestion": "Look for content with more " + (
                        "warmth and compassion" if empathy_type == "emotional_reaction"
                        else "reflective paraphrasing" if empathy_type == "interpretation"
                        else "probing questions"
                    )
                })

        # Get current phase
        if total_insights >= TRAINING_MILESTONES["optimal"]:
            current_phase = "optimal"
            phase_description = "You have enough data for optimal therapeutic AI training!"
        elif total_insights >= TRAINING_MILESTONES["therapeutic_competence"]:
            current_phase = "therapeutic_competence"
            phase_description = "You can achieve reliable therapeutic conversations. Consider adding more for optimal results."
        elif total_insights >= TRAINING_MILESTONES["minimum_viable"]:
            current_phase = "minimum_viable"
            phase_description = "You have minimum viable data. Focus on quality and diversity."
        else:
            current_phase = "building"
            phase_description = f"Building dataset. {needed['to_minimum']} more insights to minimum viable."

        return {
            "current_stats": {
                "total_insights": total_insights,
                "dialogue_chains": dialogue_chains,
                "avg_quality_score": round(avg_quality, 1),
                "avg_burstiness": round(avg_burstiness, 2) if avg_burstiness else None,
                "contractions_percentage": round(contractions_count / total_insights * 100, 1) if total_insights > 0 else 0,
                "tentative_language_percentage": round(tentative_count / total_insights * 100, 1) if total_insights > 0 else 0,
            },
            "progress": progress,
            "needed": needed,
            "videos_needed": videos_needed,
            "milestones": TRAINING_MILESTONES,
            "current_phase": current_phase,
            "phase_description": phase_description,
            "empathy_distribution": empathy_distribution,
            "tier_distribution": tier_distribution,
            "tier_5_percentage": tier_5_percentage,
            "tier_5_warning": tier_5_warning,
            "recommendations": recommendations,
            "channel_recommendations": TIER_CHANNEL_RECOMMENDATIONS,
        }


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
