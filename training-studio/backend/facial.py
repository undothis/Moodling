"""
Facial analysis service using MediaPipe and py-feat.
Extracts facial emotions, action units, gaze, and micro-expressions.
"""

import asyncio
import functools
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import numpy as np

from models import (
    FacialFeatures, FacialEmotions, ActionUnits, GazeAnalysis,
    BlinkAnalysis, MicroExpression, HeadPose, EmotionType
)
from config import settings


class FacialAnalysisService:
    """Service for extracting facial features from video."""

    def __init__(self):
        self._detector = None
        self._face_mesh = None

    def _get_detector(self):
        """Lazy-load py-feat detector."""
        if self._detector is None:
            try:
                from feat import Detector
                print("[Facial] Loading py-feat detector...")
                self._detector = Detector(
                    face_model="retinaface",
                    landmark_model="mobilefacenet",
                    au_model="xgb",
                    emotion_model="resmasknet",
                    facepose_model="img2pose"
                )
                print("[Facial] Detector loaded successfully")
            except Exception as e:
                print(f"[Facial] Error loading detector: {e}")
                self._detector = None
        return self._detector

    def _get_face_mesh(self):
        """Lazy-load MediaPipe face mesh."""
        if self._face_mesh is None:
            try:
                import mediapipe as mp
                self._face_mesh = mp.solutions.face_mesh.FaceMesh(
                    static_image_mode=False,
                    max_num_faces=2,
                    refine_landmarks=True,
                    min_detection_confidence=0.5,
                    min_tracking_confidence=0.5
                )
                print("[Facial] MediaPipe face mesh loaded")
            except Exception as e:
                print(f"[Facial] Error loading MediaPipe: {e}")
                self._face_mesh = None
        return self._face_mesh

    async def analyze_video(
        self,
        video_path: Path,
        sample_rate: int = 2,  # Analyze every Nth frame
        start_time: float = 0,
        end_time: Optional[float] = None
    ) -> List[FacialFeatures]:
        """
        Analyze facial features in video.

        Args:
            video_path: Path to video file
            sample_rate: Analyze every Nth frame (lower = more detail, slower)
            start_time: Start time in seconds
            end_time: End time in seconds

        Returns:
            List of FacialFeatures for each analyzed frame
        """
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            functools.partial(
                self._analyze_video_sync,
                video_path,
                sample_rate,
                start_time,
                end_time
            )
        )
        return result

    def _analyze_video_sync(
        self,
        video_path: Path,
        sample_rate: int,
        start_time: float,
        end_time: Optional[float]
    ) -> List[FacialFeatures]:
        """Synchronous video analysis."""
        import cv2

        print(f"[Facial] Analyzing video: {video_path}")

        cap = cv2.VideoCapture(str(video_path))
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        start_frame = int(start_time * fps)
        end_frame = int(end_time * fps) if end_time else total_frames

        # Seek to start frame
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

        results = []
        frame_count = 0
        analyzed_count = 0

        detector = self._get_detector()

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            current_frame = start_frame + frame_count

            if current_frame >= end_frame:
                break

            # Sample frames
            if frame_count % sample_rate == 0:
                timestamp = current_frame / fps

                if detector:
                    # Use py-feat for comprehensive analysis
                    features = self._analyze_frame_pyfeat(frame, timestamp)
                else:
                    # Fallback to MediaPipe only
                    features = self._analyze_frame_mediapipe(frame, timestamp)

                if features:
                    results.append(features)
                    analyzed_count += 1

            frame_count += 1

            # Progress logging
            if frame_count % 100 == 0:
                progress = (current_frame - start_frame) / (end_frame - start_frame) * 100
                print(f"[Facial] Progress: {progress:.1f}%")

        cap.release()
        print(f"[Facial] Analyzed {analyzed_count} frames")

        return results

    def _analyze_frame_pyfeat(self, frame: np.ndarray, timestamp: float) -> Optional[FacialFeatures]:
        """Analyze a single frame using py-feat."""
        detector = self._get_detector()
        if detector is None:
            return None

        try:
            # Convert BGR to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) if len(frame.shape) == 3 else frame

            # Detect faces and features
            result = detector.detect_image(frame_rgb)

            if result.empty:
                return None

            # Get first face's results
            row = result.iloc[0]

            # Extract emotions
            emotion_cols = ['anger', 'disgust', 'fear', 'happiness', 'sadness', 'surprise', 'neutral']
            emotions_dict = {}
            for col in emotion_cols:
                if col in result.columns:
                    emotions_dict[col] = float(row[col]) if not np.isnan(row[col]) else 0.0

            # Map to our emotion types
            emotions = FacialEmotions(
                neutral=emotions_dict.get('neutral', 0),
                happy=emotions_dict.get('happiness', 0),
                sad=emotions_dict.get('sadness', 0),
                angry=emotions_dict.get('anger', 0),
                fearful=emotions_dict.get('fear', 0),
                surprised=emotions_dict.get('surprise', 0),
                disgusted=emotions_dict.get('disgust', 0),
                contempt=0,  # Not in basic py-feat
                dominant=self._get_dominant_emotion(emotions_dict),
                intensity=max(emotions_dict.values()) if emotions_dict else 0
            )

            # Extract Action Units
            au_dict = {}
            for col in result.columns:
                if col.startswith('AU') and not col.endswith('_r'):
                    au_num = col.replace('AU', '')
                    try:
                        au_dict[f"AU{au_num}"] = float(row[col]) if not np.isnan(row[col]) else 0.0
                    except:
                        pass

            action_units = ActionUnits(
                AU1=au_dict.get('AU01', au_dict.get('AU1', 0)),
                AU2=au_dict.get('AU02', au_dict.get('AU2', 0)),
                AU4=au_dict.get('AU04', au_dict.get('AU4', 0)),
                AU5=au_dict.get('AU05', au_dict.get('AU5', 0)),
                AU6=au_dict.get('AU06', au_dict.get('AU6', 0)),
                AU7=au_dict.get('AU07', au_dict.get('AU7', 0)),
                AU9=au_dict.get('AU09', au_dict.get('AU9', 0)),
                AU10=au_dict.get('AU10', 0),
                AU12=au_dict.get('AU12', 0),
                AU14=au_dict.get('AU14', 0),
                AU15=au_dict.get('AU15', 0),
                AU17=au_dict.get('AU17', 0),
                AU20=au_dict.get('AU20', 0),
                AU23=au_dict.get('AU23', 0),
                AU24=au_dict.get('AU24', 0),
                AU25=au_dict.get('AU25', 0),
                AU26=au_dict.get('AU26', 0),
            )

            # Extract head pose
            head_pose = HeadPose()
            if 'Pitch' in result.columns:
                head_pose.pitch = float(row['Pitch']) if not np.isnan(row['Pitch']) else 0
            if 'Yaw' in result.columns:
                head_pose.yaw = float(row['Yaw']) if not np.isnan(row['Yaw']) else 0
            if 'Roll' in result.columns:
                head_pose.roll = float(row['Roll']) if not np.isnan(row['Roll']) else 0

            # Calculate derived scores
            authenticity = self._calculate_authenticity(emotions, action_units)
            engagement = self._calculate_engagement(action_units, head_pose)

            return FacialFeatures(
                emotions=emotions,
                action_units=action_units,
                gaze=GazeAnalysis(),  # Would need additional eye tracking
                blink=BlinkAnalysis(),  # Would need temporal analysis
                micro_expressions=[],  # Would need temporal analysis
                head_pose=head_pose,
                authenticity=authenticity,
                congruence=100.0,  # Would need audio-visual comparison
                engagement=engagement
            )

        except Exception as e:
            print(f"[Facial] Frame analysis error: {e}")
            return None

    def _analyze_frame_mediapipe(self, frame: np.ndarray, timestamp: float) -> Optional[FacialFeatures]:
        """Fallback analysis using MediaPipe only."""
        import cv2

        face_mesh = self._get_face_mesh()
        if face_mesh is None:
            return None

        try:
            # Convert to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Process frame
            results = face_mesh.process(frame_rgb)

            if not results.multi_face_landmarks:
                return None

            landmarks = results.multi_face_landmarks[0].landmark

            # Extract head pose from landmarks
            head_pose = self._estimate_head_pose_from_landmarks(landmarks, frame.shape)

            # Extract basic features from landmarks
            # This is limited compared to py-feat
            blink = self._detect_blink_from_landmarks(landmarks)

            return FacialFeatures(
                emotions=FacialEmotions(),  # Can't detect without emotion model
                action_units=ActionUnits(),  # Can't detect without AU model
                gaze=GazeAnalysis(),
                blink=blink,
                micro_expressions=[],
                head_pose=head_pose,
                authenticity=50.0,  # Unknown
                congruence=50.0,
                engagement=50.0
            )

        except Exception as e:
            print(f"[Facial] MediaPipe error: {e}")
            return None

    def _get_dominant_emotion(self, emotions: Dict[str, float]) -> EmotionType:
        """Get the dominant emotion from scores."""
        if not emotions:
            return EmotionType.NEUTRAL

        emotion_map = {
            'neutral': EmotionType.NEUTRAL,
            'happiness': EmotionType.HAPPY,
            'sadness': EmotionType.SAD,
            'anger': EmotionType.ANGRY,
            'fear': EmotionType.FEARFUL,
            'surprise': EmotionType.SURPRISED,
            'disgust': EmotionType.DISGUSTED,
            'contempt': EmotionType.CONTEMPT,
        }

        dominant = max(emotions.items(), key=lambda x: x[1])
        return emotion_map.get(dominant[0], EmotionType.NEUTRAL)

    def _calculate_authenticity(self, emotions: FacialEmotions, aus: ActionUnits) -> float:
        """
        Calculate authenticity score.

        Authentic expressions typically show:
        - Duchenne smile (AU6 + AU12 for happy)
        - Consistent AU patterns
        """
        score = 50.0  # Baseline

        # Check for Duchenne smile (genuine smile)
        if emotions.happy > 0.5:
            if aus.AU6 > 0.3 and aus.AU12 > 0.3:
                score += 30  # Genuine smile
            elif aus.AU12 > 0.3 and aus.AU6 < 0.1:
                score -= 10  # Possibly fake smile

        # Consistency check - emotions should match AU patterns
        # This is simplified; real authenticity detection is complex

        return min(max(score, 0), 100)

    def _calculate_engagement(self, aus: ActionUnits, head_pose: HeadPose) -> float:
        """
        Calculate engagement score.

        Engaged faces typically show:
        - Eyes open (low AU43)
        - Eyebrows raised (AU1, AU2)
        - Head facing forward
        """
        score = 50.0

        # Eye openness
        if aus.AU43 < 0.3:  # Eyes open
            score += 15

        # Eyebrow activity (interest)
        if aus.AU1 > 0.2 or aus.AU2 > 0.2:
            score += 15

        # Head orientation (facing camera = engaged)
        if abs(head_pose.yaw) < 15 and abs(head_pose.pitch) < 15:
            score += 20

        return min(max(score, 0), 100)

    def _estimate_head_pose_from_landmarks(
        self,
        landmarks: List,
        image_shape: Tuple[int, int, int]
    ) -> HeadPose:
        """Estimate head pose from MediaPipe landmarks."""
        # Simplified head pose estimation
        # Uses key landmarks to estimate rotation

        # Key landmark indices
        nose_tip = landmarks[1]
        left_eye = landmarks[33]
        right_eye = landmarks[263]
        mouth_left = landmarks[61]
        mouth_right = landmarks[291]

        # Calculate yaw (left-right rotation) from eye positions
        eye_center_x = (left_eye.x + right_eye.x) / 2
        yaw = (nose_tip.x - eye_center_x) * 90  # Approximate

        # Calculate pitch (up-down) from nose to eye relationship
        eye_center_y = (left_eye.y + right_eye.y) / 2
        pitch = (nose_tip.y - eye_center_y) * 90  # Approximate

        # Calculate roll from eye line angle
        import math
        dx = right_eye.x - left_eye.x
        dy = right_eye.y - left_eye.y
        roll = math.degrees(math.atan2(dy, dx))

        return HeadPose(
            pitch=round(pitch, 1),
            yaw=round(yaw, 1),
            roll=round(roll, 1)
        )

    def _detect_blink_from_landmarks(self, landmarks: List) -> BlinkAnalysis:
        """Detect blink from eye landmarks."""
        # Eye aspect ratio method
        # Upper/lower eyelid distance vs horizontal eye width

        # This requires temporal tracking for actual blink detection
        # Here we just detect if eyes are currently closed

        # Left eye landmarks
        left_eye_upper = landmarks[159].y
        left_eye_lower = landmarks[145].y
        left_eye_left = landmarks[33].x
        left_eye_right = landmarks[133].x

        left_ear = abs(left_eye_upper - left_eye_lower) / abs(left_eye_right - left_eye_left)

        # Right eye landmarks
        right_eye_upper = landmarks[386].y
        right_eye_lower = landmarks[374].y
        right_eye_left = landmarks[362].x
        right_eye_right = landmarks[263].x

        right_ear = abs(right_eye_upper - right_eye_lower) / abs(right_eye_right - right_eye_left)

        avg_ear = (left_ear + right_ear) / 2

        # Typical EAR threshold for blink detection is ~0.2
        # This is a single frame, so we can only detect if eyes are closed

        return BlinkAnalysis(
            rate_per_minute=0,  # Would need temporal tracking
            pattern="normal"
        )

    async def aggregate_analysis(
        self,
        frame_results: List[FacialFeatures]
    ) -> FacialFeatures:
        """
        Aggregate frame-level analysis into segment-level summary.
        """
        if not frame_results:
            return FacialFeatures()

        # Average emotions
        avg_emotions = FacialEmotions(
            neutral=np.mean([f.emotions.neutral for f in frame_results]),
            happy=np.mean([f.emotions.happy for f in frame_results]),
            sad=np.mean([f.emotions.sad for f in frame_results]),
            angry=np.mean([f.emotions.angry for f in frame_results]),
            fearful=np.mean([f.emotions.fearful for f in frame_results]),
            surprised=np.mean([f.emotions.surprised for f in frame_results]),
            disgusted=np.mean([f.emotions.disgusted for f in frame_results]),
            contempt=np.mean([f.emotions.contempt for f in frame_results]),
        )

        # Determine dominant emotion from averages
        emotion_scores = {
            'neutral': avg_emotions.neutral,
            'happy': avg_emotions.happy,
            'sad': avg_emotions.sad,
            'angry': avg_emotions.angry,
            'fearful': avg_emotions.fearful,
            'surprised': avg_emotions.surprised,
            'disgusted': avg_emotions.disgusted,
        }
        avg_emotions.dominant = self._get_dominant_emotion(emotion_scores)
        avg_emotions.intensity = max(emotion_scores.values())

        # Average action units
        avg_aus = ActionUnits(
            AU1=np.mean([f.action_units.AU1 for f in frame_results]),
            AU2=np.mean([f.action_units.AU2 for f in frame_results]),
            AU4=np.mean([f.action_units.AU4 for f in frame_results]),
            AU5=np.mean([f.action_units.AU5 for f in frame_results]),
            AU6=np.mean([f.action_units.AU6 for f in frame_results]),
            AU7=np.mean([f.action_units.AU7 for f in frame_results]),
            AU9=np.mean([f.action_units.AU9 for f in frame_results]),
            AU10=np.mean([f.action_units.AU10 for f in frame_results]),
            AU12=np.mean([f.action_units.AU12 for f in frame_results]),
            AU14=np.mean([f.action_units.AU14 for f in frame_results]),
            AU15=np.mean([f.action_units.AU15 for f in frame_results]),
            AU17=np.mean([f.action_units.AU17 for f in frame_results]),
            AU20=np.mean([f.action_units.AU20 for f in frame_results]),
            AU23=np.mean([f.action_units.AU23 for f in frame_results]),
            AU24=np.mean([f.action_units.AU24 for f in frame_results]),
            AU25=np.mean([f.action_units.AU25 for f in frame_results]),
            AU26=np.mean([f.action_units.AU26 for f in frame_results]),
        )

        # Average scores
        avg_authenticity = np.mean([f.authenticity for f in frame_results])
        avg_congruence = np.mean([f.congruence for f in frame_results])
        avg_engagement = np.mean([f.engagement for f in frame_results])

        return FacialFeatures(
            emotions=avg_emotions,
            action_units=avg_aus,
            gaze=GazeAnalysis(),
            blink=BlinkAnalysis(),
            micro_expressions=[],
            head_pose=HeadPose(),
            authenticity=round(avg_authenticity, 1),
            congruence=round(avg_congruence, 1),
            engagement=round(avg_engagement, 1)
        )


# Need to import cv2 at module level for type hints
try:
    import cv2
except ImportError:
    cv2 = None


# Global service instance
facial_service = FacialAnalysisService()
