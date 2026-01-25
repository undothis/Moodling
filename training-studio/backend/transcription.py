"""
Transcription service using OpenAI Whisper.
Provides word-level timestamps and language detection.
"""

import asyncio
from pathlib import Path
from typing import Optional, List, Dict, Any
import functools

from models import TranscriptResult, WordTimestamp, SpeakerSegment
from config import settings


class TranscriptionService:
    """Service for transcribing audio using Whisper."""

    def __init__(self):
        self._model = None
        self._model_name = settings.whisper_model

    def _get_model(self):
        """Lazy-load Whisper model."""
        if self._model is None:
            import whisper
            print(f"[Whisper] Loading model: {self._model_name}")
            self._model = whisper.load_model(self._model_name)
            print(f"[Whisper] Model loaded successfully")
        return self._model

    async def transcribe(
        self,
        audio_path: Path,
        language: Optional[str] = "en",
        word_timestamps: bool = True
    ) -> TranscriptResult:
        """
        Transcribe audio file using Whisper.

        Args:
            audio_path: Path to audio file (WAV, MP3, etc.)
            language: Language code (None for auto-detection)
            word_timestamps: Whether to include word-level timestamps

        Returns:
            TranscriptResult with full transcript and word timestamps
        """
        # Run Whisper in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            functools.partial(
                self._transcribe_sync,
                audio_path,
                language,
                word_timestamps
            )
        )
        return result

    def _transcribe_sync(
        self,
        audio_path: Path,
        language: Optional[str],
        word_timestamps: bool
    ) -> TranscriptResult:
        """Synchronous transcription (runs in thread pool)."""
        model = self._get_model()

        print(f"[Whisper] Transcribing: {audio_path}")

        # Transcribe with word timestamps
        result = model.transcribe(
            str(audio_path),
            language=language,
            word_timestamps=word_timestamps,
            verbose=False
        )

        # Extract words with timestamps
        words = []
        if word_timestamps and "segments" in result:
            for segment in result["segments"]:
                if "words" in segment:
                    for word_info in segment["words"]:
                        words.append(WordTimestamp(
                            word=word_info.get("word", "").strip(),
                            start=word_info.get("start", 0.0),
                            end=word_info.get("end", 0.0),
                            confidence=word_info.get("probability", 1.0)
                        ))

        # Build segments (without speaker info - that comes from diarization)
        segments = []
        for seg in result.get("segments", []):
            segment_words = []
            if "words" in seg:
                for word_info in seg["words"]:
                    segment_words.append(WordTimestamp(
                        word=word_info.get("word", "").strip(),
                        start=word_info.get("start", 0.0),
                        end=word_info.get("end", 0.0),
                        confidence=word_info.get("probability", 1.0)
                    ))

            segments.append(SpeakerSegment(
                speaker="SPEAKER_00",  # Placeholder until diarization
                start=seg.get("start", 0.0),
                end=seg.get("end", 0.0),
                text=seg.get("text", "").strip(),
                words=segment_words
            ))

        # Calculate duration from last word/segment
        duration = 0.0
        if words:
            duration = max(w.end for w in words)
        elif segments:
            duration = max(s.end for s in segments)

        print(f"[Whisper] Transcription complete: {len(words)} words, {duration:.1f}s")

        return TranscriptResult(
            text=result.get("text", "").strip(),
            language=result.get("language", language or "en"),
            duration=duration,
            words=words,
            segments=segments
        )

    async def transcribe_with_fallback(
        self,
        audio_path: Path,
        fallback_transcript: Optional[str] = None
    ) -> TranscriptResult:
        """
        Transcribe with fallback to pre-existing transcript (e.g., from YouTube).

        If Whisper fails, uses the fallback transcript (without word timestamps).
        """
        try:
            return await self.transcribe(audio_path)
        except Exception as e:
            print(f"[Whisper] Error: {e}")

            if fallback_transcript:
                print("[Whisper] Using fallback transcript")
                # Estimate duration (rough approximation)
                word_count = len(fallback_transcript.split())
                estimated_duration = word_count / 2.5  # ~150 WPM average

                return TranscriptResult(
                    text=fallback_transcript,
                    language="en",
                    duration=estimated_duration,
                    words=[],
                    segments=[SpeakerSegment(
                        speaker="SPEAKER_00",
                        start=0.0,
                        end=estimated_duration,
                        text=fallback_transcript,
                        words=[]
                    )]
                )

            raise

    def estimate_speech_rate(self, transcript: TranscriptResult) -> Dict[str, float]:
        """
        Estimate speech rate metrics from transcript.

        Returns:
            Dict with speech rate metrics (WPM, syllables/sec, etc.)
        """
        if not transcript.words or transcript.duration == 0:
            return {
                "words_per_minute": 0.0,
                "syllables_per_second": 0.0,
                "avg_word_duration": 0.0,
            }

        # Count words (excluding short pauses)
        word_count = len([w for w in transcript.words if len(w.word.strip()) > 0])

        # Calculate WPM
        duration_minutes = transcript.duration / 60.0
        wpm = word_count / duration_minutes if duration_minutes > 0 else 0

        # Estimate syllables (rough approximation: ~1.5 syllables per word in English)
        estimated_syllables = word_count * 1.5
        syllables_per_second = estimated_syllables / transcript.duration if transcript.duration > 0 else 0

        # Average word duration
        word_durations = [w.end - w.start for w in transcript.words if w.end > w.start]
        avg_word_duration = sum(word_durations) / len(word_durations) if word_durations else 0

        return {
            "words_per_minute": round(wpm, 1),
            "syllables_per_second": round(syllables_per_second, 2),
            "avg_word_duration": round(avg_word_duration, 3),
            "total_words": word_count,
            "duration_seconds": round(transcript.duration, 1),
        }

    def detect_filled_pauses(self, transcript: TranscriptResult) -> List[Dict[str, Any]]:
        """
        Detect filled pauses (um, uh, like, you know, etc.).

        Returns list of filled pause occurrences with timestamps.
        """
        filled_pause_patterns = [
            "um", "uh", "umm", "uhh", "er", "err",
            "like", "you know", "i mean", "basically",
            "sort of", "kind of", "actually", "literally"
        ]

        filled_pauses = []
        text_lower = transcript.text.lower()

        for word in transcript.words:
            word_lower = word.word.lower().strip()
            if word_lower in filled_pause_patterns:
                filled_pauses.append({
                    "word": word.word,
                    "start": word.start,
                    "end": word.end,
                    "type": "filler"
                })

        return filled_pauses


# Global service instance
transcription_service = TranscriptionService()
