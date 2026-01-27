"""
YouTube download and channel management service using yt-dlp.
Handles video/audio download, transcript fetching, and channel RSS parsing.
"""

import asyncio
import json
import re
import subprocess
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any, Literal
from xml.etree import ElementTree

import httpx

from config import settings, EXTRACTION_CATEGORIES, RECOMMENDED_CHANNELS
from models import VideoMetadata, YouTubeChannel


class YouTubeService:
    """Service for downloading YouTube content and managing channels."""

    def __init__(self):
        self.temp_path = settings.temp_path
        self.storage_path = settings.storage_path

    # =========================================================================
    # CHANNEL MANAGEMENT
    # =========================================================================

    def parse_channel_url(self, url: str) -> Dict[str, str]:
        """
        Parse various YouTube channel URL formats to extract channel info.

        Supports:
        - https://youtube.com/@handle
        - https://youtube.com/channel/UC...
        - https://youtube.com/c/channelname
        - @handle
        """
        url = url.strip()

        # Handle bare @handle
        if url.startswith("@") and "/" not in url:
            return {
                "type": "handle",
                "handle": url,
                "url": f"https://www.youtube.com/{url}"
            }

        # Handle full URLs
        patterns = [
            # @handle format
            (r"youtube\.com/@([^/\?]+)", "handle"),
            # channel ID format
            (r"youtube\.com/channel/([^/\?]+)", "channel_id"),
            # custom URL format
            (r"youtube\.com/c/([^/\?]+)", "custom"),
            # user format (legacy)
            (r"youtube\.com/user/([^/\?]+)", "user"),
        ]

        for pattern, url_type in patterns:
            match = re.search(pattern, url)
            if match:
                value = match.group(1)
                if url_type == "handle":
                    return {
                        "type": "handle",
                        "handle": f"@{value}",
                        "url": f"https://www.youtube.com/@{value}"
                    }
                elif url_type == "channel_id":
                    return {
                        "type": "channel_id",
                        "channel_id": value,
                        "url": f"https://www.youtube.com/channel/{value}"
                    }
                else:
                    return {
                        "type": url_type,
                        "name": value,
                        "url": url
                    }

        raise ValueError(f"Could not parse YouTube channel URL: {url}")

    async def get_channel_info(self, url: str) -> Dict[str, Any]:
        """
        Get channel information from YouTube.
        Uses yt-dlp to extract channel metadata.
        """
        parsed = self.parse_channel_url(url)
        channel_url = parsed["url"]

        print(f"[YouTube] Getting channel info for: {channel_url}")

        try:
            # Use yt-dlp to get channel info by fetching first video
            cmd = [
                "yt-dlp",
                "--dump-json",
                "--playlist-items", "1",
                "--flat-playlist",
                "--no-warnings",
                f"{channel_url}/videos"
            ]

            print(f"[YouTube] Running: {' '.join(cmd)}")

            result = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await result.communicate()

            if result.returncode != 0 or not stdout.strip():
                print(f"[YouTube] First attempt failed, trying alternate approach...")
                # Try without /videos suffix
                cmd = [
                    "yt-dlp",
                    "--dump-json",
                    "--playlist-items", "1",
                    "--flat-playlist",
                    "--no-warnings",
                    channel_url
                ]
                result = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, stderr = await result.communicate()

            if stdout.strip():
                # Parse first line of JSON output
                first_line = stdout.decode().strip().split('\n')[0]
                data = json.loads(first_line)

                # Use yt-dlp data if available, otherwise fall back to URL-extracted name
                handle_fallback = parsed.get("handle", "").lstrip("@") or parsed.get("name") or ""
                channel_name = data.get("channel") or data.get("uploader") or handle_fallback or data.get("channel_id") or "Unknown"
                channel_id = data.get("channel_id") or str(uuid.uuid4())[:8]

                print(f"[YouTube] Found channel: {channel_name} ({channel_id})")

                return {
                    "channel_id": channel_id,
                    "channel_name": channel_name,
                    "channel_url": data.get("channel_url") or channel_url,
                    "subscriber_count": data.get("channel_follower_count"),
                }
            else:
                print(f"[YouTube] No output from yt-dlp. stderr: {stderr.decode()}")

        except Exception as e:
            print(f"[YouTube] Error getting channel info: {e}")

        # Fallback to parsed info - extract name from handle if available
        fallback_name = parsed.get("handle", "").lstrip("@") or parsed.get("name") or "Unknown Channel"
        print(f"[YouTube] Using fallback name: {fallback_name}")

        return {
            "channel_id": parsed.get("channel_id", str(uuid.uuid4())[:8]),
            "channel_name": fallback_name,
            "channel_url": channel_url,
        }

    async def fetch_channel_videos(
        self,
        channel_url: str,
        max_videos: int = 50,
        strategy: Literal["random", "popular", "recent", "engagement", "balanced"] = "balanced"
    ) -> List[VideoMetadata]:
        """
        Fetch videos from a YouTube channel.

        Strategies:
        - random: Pure random selection
        - popular: Prioritize high view counts
        - recent: Prioritize newest videos
        - engagement: Prioritize high like/view ratio
        - balanced: 40% popular + 40% recent + 20% random
        """
        import logging
        logger = logging.getLogger(__name__)

        try:
            # Build list of URL variants to try (order matters - most reliable first)
            base_url = channel_url.rstrip('/')
            url_variants = []

            # For @handle URLs
            if "@" in base_url:
                # Try with /videos first, then without
                url_variants.append(f"{base_url}/videos")
                url_variants.append(base_url)
            # For channel ID URLs
            elif "/channel/" in base_url:
                url_variants.append(f"{base_url}/videos")
                url_variants.append(base_url)
            # For custom URLs (/c/)
            elif "/c/" in base_url:
                url_variants.append(f"{base_url}/videos")
                url_variants.append(base_url)
            # For user URLs (legacy)
            elif "/user/" in base_url:
                url_variants.append(f"{base_url}/videos")
                url_variants.append(base_url)
            else:
                # Unknown format - try both
                url_variants.append(f"{base_url}/videos")
                url_variants.append(base_url)

            stdout_text = ""

            # Try each URL variant until one works
            for attempt, try_url in enumerate(url_variants):
                logger.info(f"[YouTube] Attempt {attempt + 1}: Fetching videos from: {try_url}")
                print(f"[YouTube] Attempt {attempt + 1}: Fetching videos from: {try_url}")

                # Use yt-dlp to get playlist info
                cmd = [
                    "yt-dlp",
                    "--dump-json",
                    "--flat-playlist",
                    "--ignore-errors",  # Continue on individual video errors
                    "--no-warnings",
                    "--playlist-end", str(max_videos * 2),  # Get extra for filtering
                    try_url
                ]

                logger.info(f"[YouTube] Running: {' '.join(cmd)}")
                print(f"[YouTube] Running: {' '.join(cmd)}")

                result = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, stderr = await result.communicate()

                stdout_text = stdout.decode() if stdout else ""
                stderr_text = stderr.decode() if stderr else ""

                logger.info(f"[YouTube] yt-dlp returncode: {result.returncode}")
                logger.info(f"[YouTube] stdout length: {len(stdout_text)} chars")

                # Check if we got output
                if stdout_text.strip():
                    # Count valid JSON lines (not errors)
                    valid_lines = [l for l in stdout_text.strip().split("\n") if l.strip() and l.strip().startswith("{")]
                    if valid_lines:
                        print(f"[YouTube] Success! Got {len(valid_lines)} videos from {try_url}")
                        break
                    else:
                        print(f"[YouTube] No valid video data from {try_url}, trying next...")
                else:
                    if stderr_text:
                        logger.warning(f"[YouTube] stderr: {stderr_text[:500]}")
                    print(f"[YouTube] No output from {try_url}, trying next...")

            # If all attempts failed
            if not stdout_text.strip():
                print(f"[YouTube] All URL variants failed for channel: {channel_url}")
                return []

            # Parse JSON lines
            videos = []
            lines = stdout_text.strip().split("\n") if stdout_text.strip() else []
            logger.info(f"[YouTube] Parsing {len(lines)} JSON lines")

            # Track the actual channel we're getting videos from
            actual_channel_name = None
            actual_channel_id = None

            for i, line in enumerate(lines):
                if line:
                    try:
                        data = json.loads(line)

                        # DEBUG: Log the keys we're getting from yt-dlp
                        if i == 0:
                            logger.info(f"[YouTube] DEBUG: First JSON keys: {list(data.keys())[:15]}")
                            logger.info(f"[YouTube] DEBUG: _type={data.get('_type')}, id={data.get('id')}, title={data.get('title', 'NO TITLE')[:50] if data.get('title') else 'NONE'}")
                            # Log the actual channel info from the video
                            actual_channel_name = data.get("channel") or data.get("uploader") or "Unknown"
                            actual_channel_id = data.get("channel_id") or data.get("uploader_id") or "Unknown"
                            logger.info(f"[YouTube] ACTUAL CHANNEL: '{actual_channel_name}' (ID: {actual_channel_id})")
                            print(f"[YouTube] ACTUAL CHANNEL: '{actual_channel_name}' (ID: {actual_channel_id})")

                        # Skip playlist/channel metadata entries (not actual videos)
                        # Note: --flat-playlist returns _type="url" for video entries
                        entry_type = data.get("_type", "video")
                        if entry_type in ["playlist", "channel", "multi_video"]:
                            logger.info(f"[YouTube] Skipping {entry_type} entry: {data.get('title', 'unknown')[:50]}")
                            continue

                        # Get video ID - try multiple field names
                        video_id = data.get("id", "")
                        # Fallback: extract from URL if present
                        if not video_id:
                            url = data.get("url", "")
                            if "v=" in url:
                                video_id = url.split("v=")[-1].split("&")[0]
                            elif "/shorts/" in url:
                                video_id = url.split("/shorts/")[-1].split("?")[0]

                        # Skip if no video ID found
                        if not video_id:
                            logger.warning(f"[YouTube] Line {i}: No video_id found, _type={entry_type}, keys: {list(data.keys())[:10]}")
                            continue

                        # Skip very short videos (< 45 seconds) - likely YouTube Shorts
                        # Note: duration might be None in flat-playlist mode, that's OK
                        duration = data.get("duration")
                        if duration is not None and duration < 45:
                            logger.debug(f"[YouTube] Skipping short video ({duration}s): {data.get('title', 'unknown')}")
                            continue

                        # Get thumbnail - try multiple sources with proper fallback
                        thumbnail = None
                        # First try direct thumbnail field
                        if data.get("thumbnail"):
                            thumbnail = data.get("thumbnail")
                        # Then try thumbnails array if it exists and has items
                        elif data.get("thumbnails") and len(data.get("thumbnails", [])) > 0:
                            thumbnail = data["thumbnails"][0].get("url")

                        # Always use YouTube's standard thumbnail URL as fallback when we have video_id
                        # This ensures previews work even when yt-dlp doesn't return thumbnail data
                        if not thumbnail and video_id:
                            thumbnail = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"

                        video = VideoMetadata(
                            id=str(uuid.uuid4()),
                            video_id=video_id,
                            channel_id=data.get("channel_id") or data.get("uploader_id") or "unknown",
                            title=data.get("title", "") or f"Video {video_id}",
                            description=data.get("description", "") or "",
                            duration_seconds=duration or 0,
                            view_count=data.get("view_count", 0) or 0,
                            like_count=data.get("like_count", 0) or 0,
                            published_at=None,  # Would need additional call
                            thumbnail_url=thumbnail,
                        )
                        videos.append(video)

                        # Log every video added for debugging
                        if len(videos) <= 3:
                            logger.info(f"[YouTube] Added video {len(videos)}: {video.title[:40]}... (id={video_id})")

                    except json.JSONDecodeError as e:
                        logger.warning(f"[YouTube] JSON parse error on line {i}: {str(e)[:100]}")
                        continue
                    except Exception as e:
                        logger.error(f"[YouTube] Unexpected error on line {i}: {type(e).__name__}: {str(e)[:100]}")
                        continue

            logger.info(f"[YouTube] Successfully parsed {len(videos)} videos from {len(lines)} JSON lines")

            # Apply strategy
            if strategy == "popular":
                videos.sort(key=lambda v: v.view_count, reverse=True)
            elif strategy == "recent":
                # Already in recent order from yt-dlp
                pass
            elif strategy == "engagement":
                videos.sort(
                    key=lambda v: (v.like_count / max(v.view_count, 1)) if v.view_count else 0,
                    reverse=True
                )
            elif strategy == "balanced":
                # Split into buckets
                popular = sorted(videos, key=lambda v: v.view_count, reverse=True)
                recent = videos[:len(videos)//2]  # First half is more recent

                import random
                random.shuffle(videos)
                random_picks = videos

                # Calculate counts for balanced selection
                popular_count = int(max_videos * 0.4)
                recent_count = int(max_videos * 0.4)
                random_count = max_videos - popular_count - recent_count

                selected = set()
                result = []

                # Add popular
                for v in popular:
                    if len([x for x in result if x.video_id in selected]) >= popular_count:
                        break
                    if v.video_id not in selected:
                        result.append(v)
                        selected.add(v.video_id)

                # Add recent
                for v in recent:
                    if len([x for x in result if x.video_id in selected]) >= popular_count + recent_count:
                        break
                    if v.video_id not in selected:
                        result.append(v)
                        selected.add(v.video_id)

                # Add random
                for v in random_picks:
                    if len(result) >= max_videos:
                        break
                    if v.video_id not in selected:
                        result.append(v)
                        selected.add(v.video_id)

                videos = result
            else:  # random
                import random
                random.shuffle(videos)

            return videos[:max_videos]

        except Exception as e:
            print(f"[YouTube] Error: {e}")
            return []

    # =========================================================================
    # VIDEO DOWNLOAD
    # =========================================================================

    async def download_video(
        self,
        video_id: str,
        download_video: bool = True,
        download_audio: bool = True,
        max_resolution: int = 720
    ) -> Dict[str, Optional[Path]]:
        """
        Download video and/or audio from YouTube.

        Returns paths to downloaded files.
        """
        video_url = f"https://www.youtube.com/watch?v={video_id}"
        output_base = self.temp_path / video_id

        results = {
            "video_path": None,
            "audio_path": None,
        }

        try:
            if download_video:
                # Download video with audio
                video_output = output_base.with_suffix(".mp4")
                cmd = [
                    "yt-dlp",
                    "-f", f"bestvideo[height<={max_resolution}]+bestaudio/best[height<={max_resolution}]",
                    "--merge-output-format", "mp4",
                    "-o", str(video_output),
                    video_url
                ]

                result = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                await result.communicate()

                if video_output.exists():
                    results["video_path"] = video_output
                    print(f"[YouTube] Downloaded video: {video_output}")

            if download_audio:
                # Extract audio as WAV for processing
                audio_output = output_base.with_suffix(".wav")

                if results["video_path"]:
                    # Extract from downloaded video
                    cmd = [
                        "ffmpeg", "-y",
                        "-i", str(results["video_path"]),
                        "-vn",  # No video
                        "-acodec", "pcm_s16le",
                        "-ar", str(settings.default_sample_rate),
                        "-ac", "1",  # Mono
                        str(audio_output)
                    ]
                else:
                    # Download audio only
                    temp_audio = output_base.with_suffix(".m4a")
                    cmd = [
                        "yt-dlp",
                        "-f", "bestaudio",
                        "-o", str(temp_audio),
                        video_url
                    ]
                    result = await asyncio.create_subprocess_exec(
                        *cmd,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    await result.communicate()

                    # Convert to WAV
                    cmd = [
                        "ffmpeg", "-y",
                        "-i", str(temp_audio),
                        "-vn",
                        "-acodec", "pcm_s16le",
                        "-ar", str(settings.default_sample_rate),
                        "-ac", "1",
                        str(audio_output)
                    ]

                result = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                await result.communicate()

                if audio_output.exists():
                    results["audio_path"] = audio_output
                    print(f"[YouTube] Extracted audio: {audio_output}")

        except Exception as e:
            print(f"[YouTube] Download error: {e}")

        return results

    async def download_transcript(self, video_id: str) -> Optional[str]:
        """
        Download auto-generated transcript using yt-dlp.
        """
        video_url = f"https://www.youtube.com/watch?v={video_id}"
        output_base = self.temp_path / f"transcript_{video_id}"

        try:
            cmd = [
                "yt-dlp",
                "--write-auto-sub",
                "--sub-lang", "en",
                "--skip-download",
                "--sub-format", "vtt",
                "-o", str(output_base),
                video_url
            ]

            result = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await result.communicate()

            # Find the subtitle file
            vtt_files = list(self.temp_path.glob(f"transcript_{video_id}*.vtt"))
            if vtt_files:
                vtt_content = vtt_files[0].read_text()
                transcript = self._parse_vtt(vtt_content)

                # Cleanup
                for f in vtt_files:
                    f.unlink()

                return transcript

            # Check for no subtitles message
            output = stdout.decode() + stderr.decode()
            if "no subtitles" in output.lower():
                print(f"[YouTube] No subtitles available for {video_id}")
                return None

        except Exception as e:
            print(f"[YouTube] Transcript error: {e}")

        return None

    def _parse_vtt(self, vtt_content: str) -> str:
        """Parse VTT subtitle file to plain text."""
        lines = vtt_content.split("\n")
        text_lines = []
        last_text = ""

        for line in lines:
            # Skip VTT header, timestamps, and empty lines
            if (line.startswith("WEBVTT") or
                "-->" in line or
                line.strip() == "" or
                re.match(r"^\d+$", line.strip()) or
                line.startswith("Kind:") or
                line.startswith("Language:")):
                continue

            # Remove VTT formatting tags
            text = re.sub(r"<[^>]+>", "", line)
            text = text.replace("&nbsp;", " ")
            text = text.replace("&amp;", "&")
            text = text.replace("&lt;", "<")
            text = text.replace("&gt;", ">")
            text = text.strip()

            # Skip duplicates
            if text and text != last_text:
                text_lines.append(text)
                last_text = text

        return " ".join(text_lines)

    async def get_video_info(self, video_id: str) -> Optional[VideoMetadata]:
        """Get metadata for a single video."""
        try:
            cmd = [
                "yt-dlp",
                "--dump-json",
                f"https://www.youtube.com/watch?v={video_id}"
            ]

            result = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await result.communicate()

            if stdout:
                data = json.loads(stdout.decode())
                return VideoMetadata(
                    id=str(uuid.uuid4()),
                    video_id=data.get("id", video_id),
                    channel_id=data.get("channel_id") or "unknown",
                    title=data.get("title", ""),
                    description=data.get("description", ""),
                    duration_seconds=data.get("duration", 0),
                    view_count=data.get("view_count", 0) or 0,
                    like_count=data.get("like_count", 0) or 0,
                    published_at=datetime.fromisoformat(data["upload_date"][:4] + "-" + data["upload_date"][4:6] + "-" + data["upload_date"][6:]) if data.get("upload_date") else None,
                    thumbnail_url=data.get("thumbnail"),
                )

        except Exception as e:
            print(f"[YouTube] Error getting video info: {e}")

        return None

    # =========================================================================
    # CLEANUP
    # =========================================================================

    def cleanup_temp_files(self, video_id: str):
        """Remove temporary files for a video."""
        patterns = [
            f"{video_id}.*",
            f"transcript_{video_id}.*",
        ]

        for pattern in patterns:
            for f in self.temp_path.glob(pattern):
                try:
                    f.unlink()
                except Exception:
                    pass

    def get_recommended_channels(self) -> List[Dict[str, str]]:
        """Get list of recommended channels from config."""
        return RECOMMENDED_CHANNELS

    def get_extraction_categories(self) -> Dict[str, str]:
        """Get available extraction categories."""
        return EXTRACTION_CATEGORIES


# Global service instance
youtube_service = YouTubeService()
