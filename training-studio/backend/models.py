"""
Pydantic models for Training Studio.
Ported from TypeScript interfaces in interviewAnalysisService.ts and prosodyExtractionService.ts
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any, Literal, Union
from pydantic import BaseModel, Field


# ============================================================================
# ENUMS
# ============================================================================

class MetricalFoot(str, Enum):
    IAMB = "iamb"           # da-DUM (natural, flowing)
    TROCHEE = "trochee"     # DUM-da (commanding, definitive)
    ANAPEST = "anapest"     # da-da-DUM (building, anticipatory)
    DACTYL = "dactyl"       # DUM-da-da (expansive, lyrical)
    SPONDEE = "spondee"     # DUM-DUM (heavy, emphatic)


class InterviewType(str, Enum):
    THERAPEUTIC_SESSION = "therapeutic_session"
    COACHING_CONVERSATION = "coaching_conversation"
    CRISIS_SUPPORT = "crisis_support"
    SKILL_TEACHING = "skill_teaching"
    CASUAL_CHECK_IN = "casual_check_in"
    INTIMATE_SHARE = "intimate_share"
    STORYTELLING = "storytelling"
    CELEBRATION = "celebration"


class TherapeuticApproach(str, Enum):
    CBT = "cbt"
    DBT = "dbt"
    MOTIVATIONAL_INTERVIEWING = "motivational_interviewing"
    PERSON_CENTERED = "person_centered"
    SOLUTION_FOCUSED = "solution_focused"
    TRAUMA_INFORMED = "trauma_informed"
    MINDFULNESS_BASED = "mindfulness_based"
    SOMATIC = "somatic"
    NARRATIVE = "narrative"
    IFS = "ifs"
    ACT = "act"
    PSYCHODYNAMIC = "psychodynamic"


class EmotionType(str, Enum):
    NEUTRAL = "neutral"
    HAPPY = "happy"
    SAD = "sad"
    ANGRY = "angry"
    FEARFUL = "fearful"
    SURPRISED = "surprised"
    DISGUSTED = "disgusted"
    CONTEMPT = "contempt"


class MoodCategory(str, Enum):
    ANXIOUS = "anxious"
    DEPRESSED = "depressed"
    ANGRY = "angry"
    CALM = "calm"
    EXCITED = "excited"
    SAD = "sad"
    FEARFUL = "fearful"
    HOPEFUL = "hopeful"
    CONTEMPLATIVE = "contemplative"
    DISTRESSED = "distressed"


class CryingType(str, Enum):
    TEARFUL = "tearful"
    SNIFFLING = "sniffling"
    SOBBING = "sobbing"
    SUPPRESSED = "suppressed"
    BREAKTHROUGH = "breakthrough"


class BreathingPattern(str, Enum):
    REGULAR = "regular"
    SHALLOW = "shallow"
    RAPID = "rapid"
    HELD = "held"
    SIGHING = "sighing"


class InsightStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ProcessingStatus(str, Enum):
    QUEUED = "queued"
    DOWNLOADING = "downloading"
    EXTRACTING_AUDIO = "extracting_audio"
    TRANSCRIBING = "transcribing"
    DIARIZING = "diarizing"
    EXTRACTING_PROSODY = "extracting_prosody"
    ANALYZING_FACIAL = "analyzing_facial"
    EXTRACTING_INSIGHTS = "extracting_insights"
    COMPLETED = "completed"
    FAILED = "failed"


# ============================================================================
# PROSODY MODELS
# ============================================================================

class PitchAnalysis(BaseModel):
    """Pitch/F0 analysis results"""
    mean: float = Field(..., description="Mean pitch in Hz")
    std: float = Field(..., description="Standard deviation of pitch")
    range: float = Field(..., description="Pitch range (max - min) in Hz")
    min: float = Field(..., description="Minimum pitch in Hz")
    max: float = Field(..., description="Maximum pitch in Hz")
    contour: List[float] = Field(default_factory=list, description="Pitch values over time")
    trajectory: Literal["rising", "falling", "stable", "variable"] = "stable"


class RhythmAnalysis(BaseModel):
    """Speech rhythm analysis"""
    speech_rate_wpm: float = Field(..., description="Words per minute")
    syllables_per_second: float = Field(default=0.0, description="Syllables per second")
    articulation_rate: float = Field(default=0.0, description="Speech rate excluding pauses")
    tempo_variability: float = Field(default=0.0, description="Tempo variation 0-1")
    dominant_pattern: MetricalFoot = MetricalFoot.IAMB


class PauseAnalysis(BaseModel):
    """Pause/silence analysis"""
    frequency_per_minute: float = Field(..., description="Pauses per minute")
    mean_duration: float = Field(..., description="Mean pause duration in seconds")
    max_duration: float = Field(..., description="Maximum pause duration")
    filled_pause_count: int = Field(default=0, description="Count of 'um', 'uh', etc.")
    silent_pause_count: int = Field(default=0, description="Count of silent pauses")
    pattern: Literal["minimal", "normal", "frequent", "excessive"] = "normal"
    pause_timestamps: List[Dict[str, float]] = Field(default_factory=list)


class VolumeAnalysis(BaseModel):
    """Volume/intensity analysis"""
    mean_db: float = Field(..., description="Mean volume in dB")
    range_db: float = Field(..., description="Dynamic range in dB")
    trajectory: Literal["increasing", "decreasing", "stable", "variable"] = "stable"


class VoiceQuality(BaseModel):
    """Voice quality metrics"""
    jitter: float = Field(default=0.0, description="Pitch irregularity percentage")
    shimmer: float = Field(default=0.0, description="Amplitude irregularity percentage")
    hnr: float = Field(default=0.0, description="Harmonic-to-noise ratio in dB")
    breathiness: float = Field(default=0.0, description="Breathiness 0-1")
    creakiness: float = Field(default=0.0, description="Vocal fry/creakiness 0-1")
    tremor: float = Field(default=0.0, description="Voice shake 0-1")


class ProsodicFeatures(BaseModel):
    """Complete prosodic analysis for a speaker segment"""
    pitch: PitchAnalysis
    rhythm: RhythmAnalysis
    pauses: PauseAnalysis
    volume: VolumeAnalysis
    voice_quality: VoiceQuality

    # Overall scores
    aliveness_score: float = Field(default=0.0, description="Overall aliveness 0-100")
    naturalness_score: float = Field(default=0.0, description="Naturalness 0-100")
    emotional_expressiveness: float = Field(default=0.0, description="Expressiveness 0-100")
    engagement_score: float = Field(default=0.0, description="Engagement 0-100")


# ============================================================================
# DISTRESS MARKERS
# ============================================================================

class CryingMarkers(BaseModel):
    """Crying detection results"""
    detected: bool = False
    type: Optional[CryingType] = None
    intensity: float = Field(default=0.0, description="Intensity 0-1")
    timestamps: List[float] = Field(default_factory=list)


class VoiceBreakMarkers(BaseModel):
    """Voice break detection"""
    count: int = 0
    timestamps: List[float] = Field(default_factory=list)


class TremorMarkers(BaseModel):
    """Voice tremor detection"""
    detected: bool = False
    severity: float = Field(default=0.0, description="Severity 0-1")
    pattern: Literal["intermittent", "constant", "increasing", "decreasing"] = "intermittent"


class BreathingMarkers(BaseModel):
    """Breathing pattern analysis"""
    pattern: BreathingPattern = BreathingPattern.REGULAR
    distress_level: float = Field(default=0.0, description="Distress level 0-1")


class DistressMarkers(BaseModel):
    """Combined distress marker analysis"""
    crying: CryingMarkers = Field(default_factory=CryingMarkers)
    voice_breaks: VoiceBreakMarkers = Field(default_factory=VoiceBreakMarkers)
    tremor: TremorMarkers = Field(default_factory=TremorMarkers)
    breathing: BreathingMarkers = Field(default_factory=BreathingMarkers)
    overall_distress_level: float = Field(default=0.0, description="Overall distress 0-1")


# ============================================================================
# FACIAL ANALYSIS MODELS
# ============================================================================

class FacialEmotions(BaseModel):
    """Facial emotion recognition results"""
    neutral: float = 0.0
    happy: float = 0.0
    sad: float = 0.0
    angry: float = 0.0
    fearful: float = 0.0
    surprised: float = 0.0
    disgusted: float = 0.0
    contempt: float = 0.0
    dominant: EmotionType = EmotionType.NEUTRAL
    intensity: float = 0.0


class ActionUnits(BaseModel):
    """Facial Action Coding System (FACS) action units"""
    AU1: float = 0.0   # Inner Brow Raise
    AU2: float = 0.0   # Outer Brow Raise
    AU4: float = 0.0   # Brow Lowerer
    AU5: float = 0.0   # Upper Lid Raise
    AU6: float = 0.0   # Cheek Raise
    AU7: float = 0.0   # Lid Tightener
    AU9: float = 0.0   # Nose Wrinkle
    AU10: float = 0.0  # Upper Lip Raise
    AU12: float = 0.0  # Lip Corner Pull
    AU14: float = 0.0  # Dimpler
    AU15: float = 0.0  # Lip Corner Depress
    AU17: float = 0.0  # Chin Raise
    AU20: float = 0.0  # Lip Stretch
    AU23: float = 0.0  # Lip Tightener
    AU24: float = 0.0  # Lip Press
    AU25: float = 0.0  # Lips Part
    AU26: float = 0.0  # Jaw Drop
    AU28: float = 0.0  # Lip Suck
    AU43: float = 0.0  # Eyes Closed
    AU45: float = 0.0  # Blink


class GazeAnalysis(BaseModel):
    """Eye gaze analysis"""
    direction_x: float = 0.0
    direction_y: float = 0.0
    aversion: bool = False
    contact_duration: float = 0.0


class BlinkAnalysis(BaseModel):
    """Blink pattern analysis"""
    rate_per_minute: float = 0.0
    pattern: Literal["normal", "frequent", "rare", "irregular"] = "normal"


class MicroExpression(BaseModel):
    """Detected micro-expression"""
    timestamp: float
    emotion: EmotionType
    duration_ms: float
    type: Literal["suppressed", "neutralized", "masked", "fragmentary"]


class HeadPose(BaseModel):
    """Head pose estimation"""
    pitch: float = 0.0  # Up/down
    yaw: float = 0.0    # Left/right
    roll: float = 0.0   # Tilt


class FacialFeatures(BaseModel):
    """Complete facial analysis for a frame or segment"""
    emotions: FacialEmotions = Field(default_factory=FacialEmotions)
    action_units: ActionUnits = Field(default_factory=ActionUnits)
    gaze: GazeAnalysis = Field(default_factory=GazeAnalysis)
    blink: BlinkAnalysis = Field(default_factory=BlinkAnalysis)
    micro_expressions: List[MicroExpression] = Field(default_factory=list)
    head_pose: HeadPose = Field(default_factory=HeadPose)

    # Overall scores
    authenticity: float = Field(default=0.0, description="Fake vs genuine 0-100")
    congruence: float = Field(default=0.0, description="Face matches words 0-100")
    engagement: float = Field(default=0.0, description="Engagement level 0-100")


# ============================================================================
# SPEAKER AND TRANSCRIPT MODELS
# ============================================================================

class WordTimestamp(BaseModel):
    """Word with timing information"""
    word: str
    start: float
    end: float
    confidence: float = 1.0


class SpeakerSegment(BaseModel):
    """A segment of speech from a single speaker"""
    speaker: str = Field(..., description="Speaker identifier (SPEAKER_00, etc.)")
    start: float
    end: float
    text: str = ""
    words: List[WordTimestamp] = Field(default_factory=list)
    prosody: Optional[ProsodicFeatures] = None
    distress_markers: Optional[DistressMarkers] = None


class TranscriptSegment(BaseModel):
    """A simple transcript segment without speaker info"""
    text: str
    start: float
    end: float
    confidence: float = 1.0


class TranscriptResult(BaseModel):
    """Complete transcription result"""
    text: str
    language: str = "en"
    duration: float
    words: List[WordTimestamp] = Field(default_factory=list)
    segments: List[Union[SpeakerSegment, TranscriptSegment]] = Field(default_factory=list)


# ============================================================================
# INTERVIEW ANALYSIS MODELS
# ============================================================================

class SpeakerProfile(BaseModel):
    """Profile for a speaker in the interview"""
    speaker_id: str
    role: Literal["interviewer", "interviewee", "unknown"] = "unknown"
    speaking_time_seconds: float = 0.0
    speaking_percentage: float = 0.0
    word_count: int = 0
    avg_segment_length: float = 0.0
    prosody_summary: Optional[ProsodicFeatures] = None
    emotional_arc: List[EmotionType] = Field(default_factory=list)


class InterviewDynamics(BaseModel):
    """Dynamics between speakers"""
    speaking_ratio: Dict[str, float] = Field(default_factory=dict)
    turn_taking_count: int = 0
    avg_turn_duration: float = 0.0
    overlap_count: int = 0
    interruption_count: int = 0
    back_channel_count: int = 0
    mirroring_score: float = 0.0
    rapport_score: float = 0.0


class EmotionalArc(BaseModel):
    """Emotional journey through the interview"""
    arc_type: Literal["u_shaped", "ascending", "descending", "stable", "rollercoaster"] = "stable"
    peak_emotion: EmotionType = EmotionType.NEUTRAL
    peak_timestamp: float = 0.0
    valley_emotion: EmotionType = EmotionType.NEUTRAL
    valley_timestamp: float = 0.0
    transformation_score: float = Field(default=0.0, description="0-100")


class InterviewStatistics(BaseModel):
    """Aggregate statistics for an interview"""
    duration_seconds: float
    word_count: int
    speaker_count: int
    avg_speech_rate_wpm: float
    avg_pitch_hz: float
    avg_pause_duration: float
    pause_frequency: float
    volume_variability_db: float
    distress_occurrences: int
    volume_trajectory: Literal["stable", "sagging", "building", "variable"] = "stable"
    prosody_richness: float = Field(default=0.0, description="1-5 scale")
    emotional_range: float = Field(default=0.0, description="1-5 scale")
    authenticity: float = Field(default=0.0, description="1-5 scale")
    training_value: float = Field(default=0.0, description="1-5 scale")


# ============================================================================
# INSIGHT MODELS
# ============================================================================

class ExtractionCategory(str, Enum):
    """Categories for insight extraction"""
    # Pain domain
    EMOTIONAL_STRUGGLES = "emotional_struggles"
    COPING_STRATEGIES = "coping_strategies"
    WHAT_HELPS_HURTS = "what_helps_hurts"
    VULNERABILITY = "vulnerability"
    MENTAL_HEALTH_PATTERNS = "mental_health_patterns"
    TRAUMA_RECOVERY = "trauma_recovery"
    SHAME_GUILT = "shame_guilt"
    ANGER_FRUSTRATION = "anger_frustration"
    GRIEF_LOSS = "grief_loss"
    FEAR_ANXIETY = "fear_anxiety"
    DEPRESSION_HOPELESSNESS = "depression_hopelessness"

    # Joy domain
    HUMOR_WIT = "humor_wit"
    JOY_CELEBRATION = "joy_celebration"
    EXCITEMENT_PASSION = "excitement_passion"
    PLAYFULNESS = "playfulness"
    GRATITUDE_APPRECIATION = "gratitude_appreciation"
    CONTENTMENT_PEACE = "contentment_peace"
    HOPE_OPTIMISM = "hope_optimism"
    PRIDE_ACCOMPLISHMENT = "pride_accomplishment"
    AWE_WONDER = "awe_wonder"

    # Connection domain
    COMPANIONSHIP = "companionship"
    FRIENDSHIP_DYNAMICS = "friendship_dynamics"
    ROMANTIC_LOVE = "romantic_love"
    FAMILY_BONDS = "family_bonds"
    BELONGING_COMMUNITY = "belonging_community"
    LONELINESS_ISOLATION = "loneliness_isolation"
    PARENTING = "parenting"
    BOUNDARIES = "boundaries"
    CONFLICT_REPAIR = "conflict_repair"
    TRUST_BETRAYAL = "trust_betrayal"
    COMMUNICATION_PATTERNS = "communication_patterns"
    CAREGIVING = "caregiving"

    # Growth domain
    SELF_DISCOVERY = "self_discovery"
    GROWTH_MOMENTS = "growth_moments"
    LIFE_LESSONS = "life_lessons"
    WISDOM_PERSPECTIVE = "wisdom_perspective"
    MEANING_PURPOSE = "meaning_purpose"
    REGRET_FORGIVENESS = "regret_forgiveness"
    LIFE_TRANSITIONS = "life_transitions"
    IDENTITY_FORMATION = "identity_formation"
    VALUES_BELIEFS = "values_beliefs"
    DECISION_MAKING = "decision_making"

    # Body domain
    AGING_MORTALITY = "aging_mortality"
    BODY_HEALTH = "body_health"
    REST_BURNOUT = "rest_burnout"
    EMBODIED_EMOTION = "embodied_emotion"
    NEURODIVERGENT_EXPERIENCE = "neurodivergent_experience"
    SLEEP_ENERGY = "sleep_energy"
    ADDICTION_RECOVERY = "addiction_recovery"

    # Context domain
    CULTURAL_IDENTITY = "cultural_identity"
    SPIRITUALITY_FAITH = "spirituality_faith"
    WORK_CAREER = "work_career"
    MONEY_SCARCITY = "money_scarcity"
    GENDER_SEXUALITY = "gender_sexuality"
    CREATIVITY_EXPRESSION = "creativity_expression"

    # Authenticity domain
    REAL_QUOTES = "real_quotes"
    CONTRADICTIONS_COMPLEXITY = "contradictions_complexity"
    MESSY_MIDDLE = "messy_middle"
    UNCOMFORTABLE_TRUTHS = "uncomfortable_truths"
    BEAUTIFUL_IMPERFECTION = "beautiful_imperfection"

    # ══════════════════════════════════════════════════════════════════════════
    # ALIVENESS CATEGORIES - Texture of human conversation
    # ══════════════════════════════════════════════════════════════════════════

    # Emotional Texture
    EMOTIONAL_GRANULARITY = "emotional_granularity"
    MIXED_FEELINGS = "mixed_feelings"
    SOMATIC_MARKERS = "somatic_markers"
    EMOTIONAL_EVOLUTION = "emotional_evolution"

    # Cognitive Patterns
    TEMPORAL_ORIENTATION = "temporal_orientation"
    CONTRADICTION_HOLDING = "contradiction_holding"
    NARRATIVE_IDENTITY = "narrative_identity"
    COGNITIVE_PATTERNS = "cognitive_patterns"

    # Self-Protective Language
    MICRO_CONFESSION = "micro_confession"
    HEDGING_SHIELDS = "hedging_shields"
    PERMISSION_SEEKING = "permission_seeking"
    TOPIC_CIRCLING = "topic_circling"
    RETREAT_SIGNALS = "retreat_signals"

    # Relational Signals
    REPAIR_ATTEMPTS = "repair_attempts"
    BIDS_FOR_WITNESS = "bids_for_witness"
    ATTACHMENT_ECHOES = "attachment_echoes"
    PRONOUN_PATTERNS = "pronoun_patterns"

    # Authenticity Markers
    GUARDED_HOPE = "guarded_hope"
    HUMOR_FUNCTION = "humor_function"
    PERFORMED_VS_AUTHENTIC = "performed_vs_authentic_vulnerability"
    UNRESOLVED_QUESTIONS = "unresolved_questions"

    # Meta-Conversational
    TONE_SHIFTS = "tone_shifts"
    MEANINGFUL_SILENCE = "meaningful_silence"
    WHAT_NOT_SAID = "what_not_said"
    READINESS_SIGNALS = "readiness_signals"

    # The Rare Gold
    SELF_KINDNESS_MOMENTS = "self_kindness_moments"
    VALUES_IN_CONFLICT = "values_in_conflict"
    IDENTITY_FRICTION = "identity_friction"
    MEMORY_ECHOES = "memory_echoes"
    MEANING_RESISTANCE = "meaning_resistance"
    INTEGRATION_MOMENTS = "integration_moments"


class ExtractedInsight(BaseModel):
    """An insight extracted from a video with Aliveness texture markers"""
    id: str
    video_id: str
    title: str
    insight: str
    category: ExtractionCategory
    coaching_implication: str
    timestamp: Optional[str] = None

    # Scores
    quality_score: float = Field(default=0.0, description="Overall quality 0-100")
    specificity_score: float = Field(default=0.0, description="Specificity 0-100")
    actionability_score: float = Field(default=0.0, description="Actionability 0-100")
    safety_score: float = Field(default=0.0, description="Safety 0-100")
    novelty_score: float = Field(default=0.0, description="Novelty 0-100")
    confidence: float = Field(default=0.0, description="AI confidence 0-1")

    # Prosody context
    prosody_context: Optional[Dict[str, Any]] = None

    # Emotional context from facial/voice analysis
    emotional_context: Optional[Dict[str, Any]] = None

    # ══════════════════════════════════════════════════════════════════════════
    # ALIVENESS EXTRACTION FIELDS - Captures texture of human conversation
    # ══════════════════════════════════════════════════════════════════════════

    # Texture analysis - HOW humans speak, not just WHAT
    texture_analysis: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Aliveness texture: granularity, self-protection, temporal orientation"
    )

    # Coach response guidance - how AI should respond
    coach_response: Optional[Dict[str, Any]] = Field(
        default=None,
        description="What to do, what to avoid, example response"
    )

    # Training example - ready-to-use LLM training pair
    training_example: Optional[Dict[str, Any]] = Field(
        default=None,
        description="user_message, assistant_response, system_context"
    )

    # Raw quote from source
    raw_quote: Optional[str] = Field(default=None, description="Exact words from source")

    # Source tracking
    channel_id: Optional[str] = None
    source_token: Optional[str] = None

    # Status
    status: InsightStatus = InsightStatus.PENDING
    flagged_for_review: bool = False
    review_notes: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = None


# ============================================================================
# CHANNEL AND VIDEO MODELS
# ============================================================================

class YouTubeChannel(BaseModel):
    """A YouTube channel to process"""
    id: str
    channel_id: str
    name: str
    url: str
    category: str = "general"
    trust_level: Literal["low", "medium", "high"] = "medium"
    extraction_categories: List[ExtractionCategory] = Field(default_factory=list)
    enabled: bool = True
    videos_processed: int = 0
    insights_extracted: int = 0
    last_processed: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class VideoMetadata(BaseModel):
    """Metadata for a YouTube video"""
    id: str
    video_id: str
    channel_id: str
    title: str
    description: str = ""
    duration_seconds: int = 0
    view_count: int = 0
    like_count: int = 0
    published_at: Optional[datetime] = None
    thumbnail_url: Optional[str] = None


class ProcessingJob(BaseModel):
    """A video processing job"""
    id: str
    video_id: str
    channel_id: str
    status: ProcessingStatus = ProcessingStatus.QUEUED
    progress: float = Field(default=0.0, description="Progress 0-100")
    current_step: str = ""
    error_message: Optional[str] = None

    # Results
    transcript: Optional[TranscriptResult] = None
    speaker_profiles: List[SpeakerProfile] = Field(default_factory=list)
    interview_dynamics: Optional[InterviewDynamics] = None
    interview_statistics: Optional[InterviewStatistics] = None
    interview_type: Optional[InterviewType] = None
    therapeutic_approach: Optional[TherapeuticApproach] = None
    emotional_arc: Optional[EmotionalArc] = None
    insights: List[ExtractedInsight] = Field(default_factory=list)

    # Aliveness scores
    aliveness_scores: Dict[str, float] = Field(default_factory=dict)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


# ============================================================================
# TRAINING DATA EXPORT MODELS
# ============================================================================

class TrainingExample(BaseModel):
    """A single training example for Llama fine-tuning"""
    id: str
    messages: List[Dict[str, str]] = Field(
        ...,
        description="List of {role, content} messages"
    )
    prosody_context: Optional[Dict[str, Any]] = None
    emotional_context: Optional[Dict[str, Any]] = None
    source_video: str
    timestamp: Optional[str] = None


class TrainingDataExport(BaseModel):
    """Export format for training data"""
    version: str = "1.0"
    export_date: datetime = Field(default_factory=datetime.utcnow)
    total_examples: int = 0
    examples: List[TrainingExample] = Field(default_factory=list)
    statistics: Dict[str, Any] = Field(default_factory=dict)


# ============================================================================
# API REQUEST/RESPONSE MODELS
# ============================================================================

class ChannelCreateRequest(BaseModel):
    """Request to add a new channel"""
    url: str
    category: str = "general"
    trust_level: Literal["low", "medium", "high"] = "medium"
    extraction_categories: List[str] = Field(default_factory=list)


class ProcessVideoRequest(BaseModel):
    """Request to process a video"""
    video_url: str
    skip_facial: bool = False
    skip_prosody: bool = False


class BatchProcessRequest(BaseModel):
    """Request to process multiple videos"""
    channel_id: str
    max_videos: int = 20
    strategy: Literal["random", "popular", "recent", "engagement", "balanced"] = "balanced"
    skip_facial: bool = False
    skip_prosody: bool = False


class InsightReviewRequest(BaseModel):
    """Request to review an insight"""
    insight_id: str
    action: Literal["approve", "reject"]
    notes: Optional[str] = None


class StatisticsResponse(BaseModel):
    """Response with aggregate statistics"""
    total_videos_processed: int = 0
    total_hours_analyzed: float = 0.0
    total_insights: int = 0
    approved_insights: int = 0
    pending_insights: int = 0
    rejected_insights: int = 0

    interview_type_breakdown: Dict[str, int] = Field(default_factory=dict)
    therapeutic_approach_frequency: Dict[str, int] = Field(default_factory=dict)
    emotional_arc_patterns: Dict[str, int] = Field(default_factory=dict)
    category_distribution: Dict[str, int] = Field(default_factory=dict)

    avg_prosody_stats: Dict[str, float] = Field(default_factory=dict)
    avg_aliveness_scores: Dict[str, float] = Field(default_factory=dict)
    quality_score_distribution: Dict[str, int] = Field(default_factory=dict)


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = "ok"
    version: str = "1.0.0"
    services: Dict[str, bool] = Field(default_factory=dict)
