"""
Prosody extraction service using librosa and parselmouth (Praat).
Extracts pitch, rhythm, pauses, volume, and voice quality features.
"""

import asyncio
import functools
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import numpy as np

from models import (
    ProsodicFeatures, PitchAnalysis, RhythmAnalysis, PauseAnalysis,
    VolumeAnalysis, VoiceQuality, DistressMarkers, CryingMarkers,
    VoiceBreakMarkers, TremorMarkers, BreathingMarkers,
    MetricalFoot, CryingType, BreathingPattern
)
from config import settings


class ProsodyService:
    """Service for extracting prosodic features from audio."""

    def __init__(self):
        self.sample_rate = settings.default_sample_rate

    async def extract_prosody(
        self,
        audio_path: Path,
        segment_start: float = 0,
        segment_end: Optional[float] = None
    ) -> ProsodicFeatures:
        """
        Extract all prosodic features from audio segment.

        Args:
            audio_path: Path to audio file
            segment_start: Start time in seconds
            segment_end: End time in seconds (None for full file)

        Returns:
            ProsodicFeatures with all extracted metrics
        """
        # Run extraction in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            functools.partial(
                self._extract_prosody_sync,
                audio_path,
                segment_start,
                segment_end
            )
        )
        return result

    def _extract_prosody_sync(
        self,
        audio_path: Path,
        segment_start: float,
        segment_end: Optional[float]
    ) -> ProsodicFeatures:
        """Synchronous prosody extraction."""
        import librosa
        import parselmouth

        print(f"[Prosody] Extracting from: {audio_path}")

        # Load audio
        y, sr = librosa.load(str(audio_path), sr=self.sample_rate)

        # Extract segment if specified
        if segment_start > 0 or segment_end is not None:
            start_sample = int(segment_start * sr)
            end_sample = int(segment_end * sr) if segment_end else len(y)
            y = y[start_sample:end_sample]

        duration = len(y) / sr

        # Extract all features
        pitch = self._extract_pitch(audio_path, segment_start, segment_end)
        rhythm = self._extract_rhythm(y, sr)
        pauses = self._extract_pauses(y, sr)
        volume = self._extract_volume(y, sr)
        voice_quality = self._extract_voice_quality(audio_path, segment_start, segment_end)

        # Calculate overall scores
        aliveness = self._calculate_aliveness_score(pitch, rhythm, pauses, volume)
        naturalness = self._calculate_naturalness_score(pitch, rhythm, voice_quality)
        expressiveness = self._calculate_expressiveness_score(pitch, volume)
        engagement = self._calculate_engagement_score(pitch, rhythm, pauses)

        print(f"[Prosody] Extraction complete: aliveness={aliveness:.1f}")

        return ProsodicFeatures(
            pitch=pitch,
            rhythm=rhythm,
            pauses=pauses,
            volume=volume,
            voice_quality=voice_quality,
            aliveness_score=aliveness,
            naturalness_score=naturalness,
            emotional_expressiveness=expressiveness,
            engagement_score=engagement
        )

    def _extract_pitch(
        self,
        audio_path: Path,
        segment_start: float,
        segment_end: Optional[float]
    ) -> PitchAnalysis:
        """Extract pitch (F0) features using parselmouth."""
        import parselmouth

        sound = parselmouth.Sound(str(audio_path))

        # Extract segment if specified
        if segment_start > 0 or segment_end is not None:
            end_time = segment_end if segment_end else sound.duration
            sound = sound.extract_part(segment_start, end_time)

        # Get pitch
        pitch = sound.to_pitch(time_step=0.01)  # 10ms steps
        pitch_values = pitch.selected_array['frequency']

        # Filter out unvoiced frames (0 Hz)
        voiced_values = pitch_values[pitch_values > 0]

        if len(voiced_values) == 0:
            return PitchAnalysis(
                mean=0, std=0, range=0, min=0, max=0,
                contour=[], trajectory="stable"
            )

        # Calculate statistics
        mean_pitch = float(np.mean(voiced_values))
        std_pitch = float(np.std(voiced_values))
        min_pitch = float(np.min(voiced_values))
        max_pitch = float(np.max(voiced_values))
        pitch_range = max_pitch - min_pitch

        # Determine trajectory
        if len(voiced_values) > 10:
            first_quarter = np.mean(voiced_values[:len(voiced_values)//4])
            last_quarter = np.mean(voiced_values[-len(voiced_values)//4:])
            diff = last_quarter - first_quarter
            threshold = std_pitch * 0.5

            if diff > threshold:
                trajectory = "rising"
            elif diff < -threshold:
                trajectory = "falling"
            elif std_pitch > mean_pitch * 0.1:
                trajectory = "variable"
            else:
                trajectory = "stable"
        else:
            trajectory = "stable"

        # Downsample contour for storage
        contour = list(voiced_values[::10])[:100]  # Max 100 points

        return PitchAnalysis(
            mean=round(mean_pitch, 1),
            std=round(std_pitch, 1),
            range=round(pitch_range, 1),
            min=round(min_pitch, 1),
            max=round(max_pitch, 1),
            contour=contour,
            trajectory=trajectory
        )

    def _extract_rhythm(self, y: np.ndarray, sr: int) -> RhythmAnalysis:
        """Extract rhythm and tempo features using librosa."""
        import librosa

        duration = len(y) / sr

        # Estimate tempo
        tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
        if isinstance(tempo, np.ndarray):
            tempo = float(tempo[0])

        # Onset detection
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        onset_frames = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)
        onset_times = librosa.frames_to_time(onset_frames, sr=sr)

        # Calculate tempo variability from inter-onset intervals
        if len(onset_times) > 2:
            ioi = np.diff(onset_times)
            tempo_variability = float(np.std(ioi) / np.mean(ioi)) if np.mean(ioi) > 0 else 0
        else:
            tempo_variability = 0

        # Estimate speech rate (rough approximation from onset density)
        onset_rate = len(onset_times) / duration if duration > 0 else 0
        estimated_wpm = onset_rate * 60 * 0.5  # Rough conversion

        # Dominant metrical pattern (simplified)
        dominant_pattern = self._detect_metrical_pattern(onset_env, sr)

        return RhythmAnalysis(
            speech_rate_wpm=round(estimated_wpm, 1),
            syllables_per_second=round(onset_rate, 2),
            articulation_rate=round(onset_rate * 1.2, 2),  # Approximation
            tempo_variability=round(min(tempo_variability, 1.0), 2),
            dominant_pattern=dominant_pattern
        )

    def _detect_metrical_pattern(self, onset_env: np.ndarray, sr: int) -> MetricalFoot:
        """Detect dominant metrical pattern from onset envelope."""
        import librosa

        # Simplified pattern detection based on onset spacing
        # This is a heuristic - real scansion would need linguistic analysis

        if len(onset_env) < 10:
            return MetricalFoot.IAMB  # Default

        # Look at onset strength patterns
        onset_frames = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)

        if len(onset_frames) < 4:
            return MetricalFoot.IAMB

        # Calculate intervals
        intervals = np.diff(onset_frames)
        if len(intervals) < 3:
            return MetricalFoot.IAMB

        # Look for patterns
        # Iamb: short-long pattern
        # Trochee: long-short pattern
        # Anapest: short-short-long
        # Dactyl: long-short-short
        # Spondee: long-long

        avg_interval = np.mean(intervals)

        short_long = sum(1 for i in range(len(intervals)-1)
                        if intervals[i] < avg_interval and intervals[i+1] >= avg_interval)
        long_short = sum(1 for i in range(len(intervals)-1)
                        if intervals[i] >= avg_interval and intervals[i+1] < avg_interval)

        if short_long > long_short * 1.5:
            return MetricalFoot.IAMB
        elif long_short > short_long * 1.5:
            return MetricalFoot.TROCHEE
        else:
            return MetricalFoot.IAMB  # Default to iamb (most common in English)

    def _extract_pauses(self, y: np.ndarray, sr: int) -> PauseAnalysis:
        """Extract pause features from audio."""
        import librosa

        duration = len(y) / sr

        # Detect silent intervals
        intervals = librosa.effects.split(y, top_db=30)

        pauses = []
        for i in range(len(intervals) - 1):
            pause_start = intervals[i][1] / sr
            pause_end = intervals[i + 1][0] / sr
            pause_duration = pause_end - pause_start

            if pause_duration > 0.2:  # Minimum 200ms pause
                pauses.append({
                    "start": pause_start,
                    "end": pause_end,
                    "duration": pause_duration
                })

        if not pauses:
            return PauseAnalysis(
                frequency_per_minute=0,
                mean_duration=0,
                max_duration=0,
                filled_pause_count=0,
                silent_pause_count=0,
                pattern="minimal",
                pause_timestamps=[]
            )

        # Calculate statistics
        pause_durations = [p["duration"] for p in pauses]
        pauses_per_minute = len(pauses) / (duration / 60) if duration > 0 else 0

        # Determine pattern
        if pauses_per_minute < 2:
            pattern = "minimal"
        elif pauses_per_minute < 5:
            pattern = "normal"
        elif pauses_per_minute < 10:
            pattern = "frequent"
        else:
            pattern = "excessive"

        return PauseAnalysis(
            frequency_per_minute=round(pauses_per_minute, 1),
            mean_duration=round(np.mean(pause_durations), 2),
            max_duration=round(max(pause_durations), 2),
            filled_pause_count=0,  # Requires transcript analysis
            silent_pause_count=len(pauses),
            pattern=pattern,
            pause_timestamps=pauses[:50]  # Limit stored pauses
        )

    def _extract_volume(self, y: np.ndarray, sr: int) -> VolumeAnalysis:
        """Extract volume/intensity features."""
        import librosa

        # Calculate RMS energy
        rms = librosa.feature.rms(y=y)[0]

        # Convert to dB
        rms_db = librosa.amplitude_to_db(rms, ref=np.max)

        mean_db = float(np.mean(rms_db))
        range_db = float(np.max(rms_db) - np.min(rms_db))

        # Determine trajectory
        if len(rms_db) > 10:
            first_quarter = np.mean(rms_db[:len(rms_db)//4])
            last_quarter = np.mean(rms_db[-len(rms_db)//4:])
            diff = last_quarter - first_quarter

            if diff > 3:  # 3dB threshold
                trajectory = "increasing"
            elif diff < -3:
                trajectory = "decreasing"
            elif np.std(rms_db) > 5:
                trajectory = "variable"
            else:
                trajectory = "stable"
        else:
            trajectory = "stable"

        return VolumeAnalysis(
            mean_db=round(mean_db, 1),
            range_db=round(range_db, 1),
            trajectory=trajectory
        )

    def _extract_voice_quality(
        self,
        audio_path: Path,
        segment_start: float,
        segment_end: Optional[float]
    ) -> VoiceQuality:
        """Extract voice quality features using parselmouth."""
        import parselmouth
        from parselmouth.praat import call

        sound = parselmouth.Sound(str(audio_path))

        # Extract segment if specified
        if segment_start > 0 or segment_end is not None:
            end_time = segment_end if segment_end else sound.duration
            sound = sound.extract_part(segment_start, end_time)

        try:
            # Get pitch and point process for voice quality measures
            pitch = sound.to_pitch(time_step=0.01)
            point_process = call(sound, "To PointProcess (periodic, cc)", 75, 500)

            # Jitter (pitch perturbation)
            jitter = call(point_process, "Get jitter (local)", 0, 0, 0.0001, 0.02, 1.3)

            # Shimmer (amplitude perturbation)
            shimmer = call([sound, point_process], "Get shimmer (local)", 0, 0, 0.0001, 0.02, 1.3, 1.6)

            # Harmonics-to-noise ratio
            harmonicity = sound.to_harmonicity()
            hnr = call(harmonicity, "Get mean", 0, 0)

            return VoiceQuality(
                jitter=round(jitter * 100, 2) if jitter else 0,  # Convert to percentage
                shimmer=round(shimmer * 100, 2) if shimmer else 0,
                hnr=round(hnr, 1) if hnr else 0,
                breathiness=0,  # Would need additional analysis
                creakiness=0,   # Would need additional analysis
                tremor=0        # Would need additional analysis
            )

        except Exception as e:
            print(f"[Prosody] Voice quality extraction error: {e}")
            return VoiceQuality()

    def _calculate_aliveness_score(
        self,
        pitch: PitchAnalysis,
        rhythm: RhythmAnalysis,
        pauses: PauseAnalysis,
        volume: VolumeAnalysis
    ) -> float:
        """
        Calculate overall "aliveness" score (0-100).

        Based on the 10 Aliveness Qualities from the documentation:
        - Imperfect rhythm
        - Natural latency (pauses)
        - Amplitude restraint
        - Flow quality
        """
        scores = []

        # Imperfect rhythm (from tempo variability)
        # Higher variability = more alive
        rhythm_score = min(rhythm.tempo_variability * 100, 100) * 0.8 + 20
        scores.append(rhythm_score)

        # Natural latency (from pause frequency)
        # Some pauses = good, too many or none = less alive
        if 2 <= pauses.frequency_per_minute <= 8:
            pause_score = 100
        elif pauses.frequency_per_minute < 2:
            pause_score = pauses.frequency_per_minute * 50
        else:
            pause_score = max(100 - (pauses.frequency_per_minute - 8) * 10, 50)
        scores.append(pause_score)

        # Amplitude restraint (from volume)
        # Moderate range = good, extreme = less natural
        if 5 <= volume.range_db <= 15:
            volume_score = 100
        else:
            volume_score = max(100 - abs(volume.range_db - 10) * 5, 50)
        scores.append(volume_score)

        # Flow quality (from pitch trajectory stability)
        # Variable but not chaotic = best
        if pitch.trajectory in ["stable", "variable"]:
            flow_score = 90
        else:
            flow_score = 70
        scores.append(flow_score)

        return round(np.mean(scores), 1)

    def _calculate_naturalness_score(
        self,
        pitch: PitchAnalysis,
        rhythm: RhythmAnalysis,
        voice_quality: VoiceQuality
    ) -> float:
        """Calculate naturalness score (0-100)."""
        scores = []

        # Pitch naturalness (some variation is natural)
        if 20 <= pitch.std <= 50:
            pitch_score = 100
        else:
            pitch_score = max(100 - abs(pitch.std - 35) * 2, 50)
        scores.append(pitch_score)

        # Speech rate naturalness (typical conversational range)
        if 100 <= rhythm.speech_rate_wpm <= 180:
            rate_score = 100
        else:
            rate_score = max(100 - abs(rhythm.speech_rate_wpm - 140) / 2, 50)
        scores.append(rate_score)

        # Voice quality (lower jitter/shimmer = clearer voice)
        quality_score = max(100 - (voice_quality.jitter + voice_quality.shimmer) * 5, 50)
        scores.append(quality_score)

        return round(np.mean(scores), 1)

    def _calculate_expressiveness_score(
        self,
        pitch: PitchAnalysis,
        volume: VolumeAnalysis
    ) -> float:
        """Calculate emotional expressiveness score (0-100)."""
        # Higher pitch range and volume range = more expressive
        pitch_contribution = min(pitch.range / 100 * 50, 50)
        volume_contribution = min(volume.range_db / 20 * 50, 50)

        return round(pitch_contribution + volume_contribution, 1)

    def _calculate_engagement_score(
        self,
        pitch: PitchAnalysis,
        rhythm: RhythmAnalysis,
        pauses: PauseAnalysis
    ) -> float:
        """Calculate engagement score (0-100)."""
        scores = []

        # Higher pitch variation suggests engagement
        scores.append(min(pitch.std / 30 * 100, 100))

        # Moderate speech rate suggests engagement
        if 120 <= rhythm.speech_rate_wpm <= 160:
            scores.append(100)
        else:
            scores.append(max(100 - abs(rhythm.speech_rate_wpm - 140), 60))

        # Some pauses (for thought) but not excessive
        if 3 <= pauses.frequency_per_minute <= 6:
            scores.append(100)
        else:
            scores.append(70)

        return round(np.mean(scores), 1)

    async def detect_distress_markers(
        self,
        audio_path: Path,
        segment_start: float = 0,
        segment_end: Optional[float] = None
    ) -> DistressMarkers:
        """
        Detect distress markers in audio (crying, voice breaks, tremor, etc.).
        """
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            functools.partial(
                self._detect_distress_sync,
                audio_path,
                segment_start,
                segment_end
            )
        )
        return result

    def _detect_distress_sync(
        self,
        audio_path: Path,
        segment_start: float,
        segment_end: Optional[float]
    ) -> DistressMarkers:
        """Synchronous distress detection."""
        import librosa
        import parselmouth

        # Load audio
        y, sr = librosa.load(str(audio_path), sr=self.sample_rate)

        if segment_start > 0 or segment_end is not None:
            start_sample = int(segment_start * sr)
            end_sample = int(segment_end * sr) if segment_end else len(y)
            y = y[start_sample:end_sample]

        # Load with parselmouth for pitch analysis
        sound = parselmouth.Sound(str(audio_path))
        if segment_start > 0 or segment_end is not None:
            end_time = segment_end if segment_end else sound.duration
            sound = sound.extract_part(segment_start, end_time)

        # Detect voice breaks (sudden pitch changes)
        voice_breaks = self._detect_voice_breaks(sound)

        # Detect tremor (pitch wobble)
        tremor = self._detect_tremor(sound)

        # Detect crying markers (simplified)
        crying = self._detect_crying_markers(y, sr)

        # Detect breathing patterns
        breathing = self._detect_breathing_patterns(y, sr)

        # Calculate overall distress level
        distress_indicators = [
            1 if voice_breaks.count > 2 else 0,
            1 if tremor.detected else 0,
            1 if crying.detected else 0,
            1 if breathing.pattern in [BreathingPattern.RAPID, BreathingPattern.SHALLOW] else 0
        ]
        overall_distress = sum(distress_indicators) / len(distress_indicators)

        return DistressMarkers(
            crying=crying,
            voice_breaks=voice_breaks,
            tremor=tremor,
            breathing=breathing,
            overall_distress_level=round(overall_distress, 2)
        )

    def _detect_voice_breaks(self, sound) -> VoiceBreakMarkers:
        """Detect voice breaks (pitch cracks)."""
        import parselmouth
        from parselmouth.praat import call

        try:
            pitch = sound.to_pitch()
            pitch_values = pitch.selected_array['frequency']

            # Look for sudden pitch jumps
            voiced = pitch_values[pitch_values > 0]
            if len(voiced) < 10:
                return VoiceBreakMarkers()

            # Calculate pitch differences
            diffs = np.abs(np.diff(voiced))
            threshold = np.std(voiced) * 2

            # Find breaks (large sudden changes)
            break_indices = np.where(diffs > threshold)[0]

            return VoiceBreakMarkers(
                count=len(break_indices),
                timestamps=[float(i * 0.01) for i in break_indices[:20]]  # Limit to 20
            )

        except Exception:
            return VoiceBreakMarkers()

    def _detect_tremor(self, sound) -> TremorMarkers:
        """Detect voice tremor (pitch wobble)."""
        import parselmouth

        try:
            pitch = sound.to_pitch(time_step=0.005)  # Finer resolution
            pitch_values = pitch.selected_array['frequency']

            voiced = pitch_values[pitch_values > 0]
            if len(voiced) < 20:
                return TremorMarkers()

            # Look for periodic oscillation in pitch
            from scipy import signal

            # Detrend and look for tremor frequency (4-12 Hz typical)
            detrended = signal.detrend(voiced)
            fft = np.abs(np.fft.fft(detrended))
            freqs = np.fft.fftfreq(len(detrended), 0.005)

            # Look for energy in tremor frequency range
            tremor_range = (freqs >= 4) & (freqs <= 12)
            tremor_energy = np.sum(fft[tremor_range])
            total_energy = np.sum(fft)

            tremor_ratio = tremor_energy / total_energy if total_energy > 0 else 0

            detected = tremor_ratio > 0.1
            severity = min(tremor_ratio * 5, 1.0)

            return TremorMarkers(
                detected=detected,
                severity=round(severity, 2),
                pattern="intermittent" if detected else "intermittent"
            )

        except Exception:
            return TremorMarkers()

    def _detect_crying_markers(self, y: np.ndarray, sr: int) -> CryingMarkers:
        """Detect crying markers (simplified detection)."""
        import librosa

        # This is a simplified heuristic approach
        # Real crying detection would need a trained classifier

        # Look for characteristics of crying:
        # - Irregular rhythm
        # - Sniffling sounds (high frequency bursts)
        # - Voice breaks

        # Spectral analysis
        spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]

        # High variability in spectral features can indicate emotional speech
        centroid_var = np.std(spectral_centroid) / np.mean(spectral_centroid) if np.mean(spectral_centroid) > 0 else 0

        # Simplified crying detection threshold
        detected = centroid_var > 0.5

        return CryingMarkers(
            detected=detected,
            type=CryingType.TEARFUL if detected else None,
            intensity=min(centroid_var, 1.0) if detected else 0,
            timestamps=[]
        )

    def _detect_breathing_patterns(self, y: np.ndarray, sr: int) -> BreathingMarkers:
        """Detect breathing patterns."""
        import librosa

        # Detect silent intervals that might be breaths
        intervals = librosa.effects.split(y, top_db=35)
        duration = len(y) / sr

        if len(intervals) < 2:
            return BreathingMarkers(pattern=BreathingPattern.REGULAR, distress_level=0)

        # Calculate breath intervals
        breath_gaps = []
        for i in range(len(intervals) - 1):
            gap_start = intervals[i][1] / sr
            gap_end = intervals[i + 1][0] / sr
            gap_duration = gap_end - gap_start

            if 0.3 <= gap_duration <= 3.0:  # Typical breath duration
                breath_gaps.append(gap_duration)

        if not breath_gaps:
            return BreathingMarkers(pattern=BreathingPattern.REGULAR, distress_level=0)

        avg_breath = np.mean(breath_gaps)
        breath_var = np.std(breath_gaps)

        # Determine pattern
        if avg_breath < 0.5 and len(breath_gaps) / (duration / 60) > 20:
            pattern = BreathingPattern.RAPID
            distress = 0.7
        elif avg_breath < 0.7:
            pattern = BreathingPattern.SHALLOW
            distress = 0.4
        elif breath_var > avg_breath * 0.5:
            pattern = BreathingPattern.SIGHING
            distress = 0.3
        else:
            pattern = BreathingPattern.REGULAR
            distress = 0

        return BreathingMarkers(
            pattern=pattern,
            distress_level=round(distress, 2)
        )


# Global service instance
prosody_service = ProsodyService()
