"""
Speaker diarization service using pyannote.audio.
Identifies who spoke when in multi-speaker audio.
"""

import asyncio
import functools
from pathlib import Path
from typing import List, Dict, Any, Optional

from models import TranscriptResult, SpeakerSegment, WordTimestamp
from config import settings


class DiarizationService:
    """Service for speaker diarization using pyannote.audio."""

    def __init__(self):
        self._pipeline = None

    def _get_pipeline(self):
        """Lazy-load pyannote diarization pipeline."""
        if self._pipeline is None:
            print("[Pyannote] Loading diarization pipeline...")
            try:
                from pyannote.audio import Pipeline

                # Requires HuggingFace token for pyannote models
                if settings.huggingface_token:
                    self._pipeline = Pipeline.from_pretrained(
                        "pyannote/speaker-diarization-3.0",
                        use_auth_token=settings.huggingface_token
                    )
                else:
                    print("[Pyannote] Warning: No HuggingFace token. Using basic diarization.")
                    # Fallback to a simpler approach or raise error
                    self._pipeline = None

                print("[Pyannote] Pipeline loaded successfully")
            except Exception as e:
                print(f"[Pyannote] Error loading pipeline: {e}")
                self._pipeline = None

        return self._pipeline

    async def diarize(
        self,
        audio_path: Path,
        min_speakers: int = 1,
        max_speakers: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Perform speaker diarization on audio file.

        Args:
            audio_path: Path to audio file
            min_speakers: Minimum expected number of speakers
            max_speakers: Maximum expected number of speakers

        Returns:
            List of speaker segments with start, end, and speaker label
        """
        pipeline = self._get_pipeline()

        if pipeline is None:
            print("[Pyannote] Pipeline not available, using single-speaker fallback")
            return await self._fallback_diarization(audio_path)

        # Run diarization in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            functools.partial(
                self._diarize_sync,
                audio_path,
                min_speakers,
                max_speakers
            )
        )
        return result

    def _diarize_sync(
        self,
        audio_path: Path,
        min_speakers: int,
        max_speakers: int
    ) -> List[Dict[str, Any]]:
        """Synchronous diarization (runs in thread pool)."""
        pipeline = self._get_pipeline()

        print(f"[Pyannote] Diarizing: {audio_path}")

        # Run diarization
        diarization = pipeline(
            str(audio_path),
            min_speakers=min_speakers,
            max_speakers=max_speakers
        )

        # Extract speaker segments
        segments = []
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            segments.append({
                "start": turn.start,
                "end": turn.end,
                "speaker": speaker,
                "duration": turn.end - turn.start
            })

        print(f"[Pyannote] Found {len(set(s['speaker'] for s in segments))} speakers, {len(segments)} segments")

        return segments

    async def _fallback_diarization(self, audio_path: Path) -> List[Dict[str, Any]]:
        """Fallback diarization when pyannote is not available."""
        # Simple fallback: assume single speaker, segment by silence
        try:
            import librosa
            import numpy as np

            y, sr = librosa.load(str(audio_path), sr=16000)
            duration = len(y) / sr

            # Use energy-based segmentation
            frame_length = int(0.025 * sr)  # 25ms frames
            hop_length = int(0.010 * sr)    # 10ms hop

            # Calculate RMS energy
            rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]

            # Threshold for speech detection
            threshold = np.mean(rms) * 0.5

            # Find speech segments
            is_speech = rms > threshold
            segments = []
            in_speech = False
            speech_start = 0

            for i, speech in enumerate(is_speech):
                time = i * hop_length / sr
                if speech and not in_speech:
                    speech_start = time
                    in_speech = True
                elif not speech and in_speech:
                    if time - speech_start > 0.5:  # Minimum segment duration
                        segments.append({
                            "start": speech_start,
                            "end": time,
                            "speaker": "SPEAKER_00",
                            "duration": time - speech_start
                        })
                    in_speech = False

            # Handle last segment
            if in_speech:
                segments.append({
                    "start": speech_start,
                    "end": duration,
                    "speaker": "SPEAKER_00",
                    "duration": duration - speech_start
                })

            return segments if segments else [{"start": 0, "end": duration, "speaker": "SPEAKER_00", "duration": duration}]

        except Exception as e:
            print(f"[Diarization] Fallback error: {e}")
            return []

    def merge_transcript_with_diarization(
        self,
        transcript: TranscriptResult,
        diarization: List[Dict[str, Any]]
    ) -> TranscriptResult:
        """
        Merge transcript words with speaker diarization.

        Assigns speaker labels to transcript segments based on timing overlap.
        """
        if not diarization:
            return transcript

        # Create new segments with speaker labels
        new_segments = []

        for diar_seg in diarization:
            # Find words that fall within this diarization segment
            segment_words = []
            segment_text_parts = []

            for word in transcript.words:
                # Word midpoint determines which segment it belongs to
                word_mid = (word.start + word.end) / 2
                if diar_seg["start"] <= word_mid <= diar_seg["end"]:
                    segment_words.append(word)
                    segment_text_parts.append(word.word)

            if segment_words:
                new_segments.append(SpeakerSegment(
                    speaker=diar_seg["speaker"],
                    start=diar_seg["start"],
                    end=diar_seg["end"],
                    text=" ".join(segment_text_parts).strip(),
                    words=segment_words
                ))

        # Update transcript with new segments
        transcript.segments = new_segments
        return transcript

    def calculate_speaker_statistics(
        self,
        segments: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Calculate statistics for each speaker.

        Returns dict of speaker -> stats (speaking time, percentage, etc.)
        """
        if not segments:
            return {}

        total_duration = sum(s["duration"] for s in segments)
        speakers = {}

        for seg in segments:
            speaker = seg["speaker"]
            if speaker not in speakers:
                speakers[speaker] = {
                    "speaking_time": 0,
                    "segment_count": 0,
                    "segments": []
                }

            speakers[speaker]["speaking_time"] += seg["duration"]
            speakers[speaker]["segment_count"] += 1
            speakers[speaker]["segments"].append(seg)

        # Calculate percentages and averages
        for speaker, stats in speakers.items():
            stats["speaking_percentage"] = (stats["speaking_time"] / total_duration * 100) if total_duration > 0 else 0
            stats["avg_segment_duration"] = stats["speaking_time"] / stats["segment_count"] if stats["segment_count"] > 0 else 0

        return speakers

    def identify_interviewer(
        self,
        speaker_stats: Dict[str, Dict[str, Any]]
    ) -> Optional[str]:
        """
        Attempt to identify which speaker is the interviewer.

        Heuristic: Interviewer typically speaks less (30-40%) and has shorter segments.
        """
        if len(speaker_stats) != 2:
            return None  # Can only identify in 2-speaker scenarios

        speakers = list(speaker_stats.items())

        # Sort by speaking percentage
        speakers.sort(key=lambda x: x[1]["speaking_percentage"])

        # Interviewer likely has less speaking time
        likely_interviewer = speakers[0][0]
        interviewer_pct = speakers[0][1]["speaking_percentage"]

        # Sanity check: interviewer should have 20-50% of speaking time
        if 20 <= interviewer_pct <= 50:
            return likely_interviewer

        return None


# Global service instance
diarization_service = DiarizationService()
