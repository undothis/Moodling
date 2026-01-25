"""
Configuration settings for Training Studio.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env file if it exists
load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Keys
    anthropic_api_key: str = ""
    huggingface_token: str = ""
    openai_api_key: str = ""  # Optional, for Whisper API fallback

    # Database
    database_url: str = "sqlite+aiosqlite:///./training_studio.db"

    # File Storage
    storage_path: Path = Path("./storage")
    temp_path: Path = Path("./temp")

    # Processing Settings
    whisper_model: str = "large-v3"  # tiny, base, small, medium, large, large-v3
    max_video_duration_minutes: int = 120
    default_sample_rate: int = 16000

    # Quality Thresholds
    min_quality_score: float = 60.0
    min_specificity_score: float = 50.0
    min_safety_score: float = 80.0
    min_confidence_score: float = 0.6
    human_review_threshold: float = 75.0

    # Rate Limiting
    delay_between_videos_seconds: int = 3
    delay_after_error_seconds: int = 10
    max_videos_per_batch: int = 25

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list = ["*"]

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()


# Ensure directories exist
def init_directories():
    """Create necessary directories."""
    settings.storage_path.mkdir(parents=True, exist_ok=True)
    settings.temp_path.mkdir(parents=True, exist_ok=True)

    # Subdirectories
    (settings.storage_path / "videos").mkdir(exist_ok=True)
    (settings.storage_path / "audio").mkdir(exist_ok=True)
    (settings.storage_path / "transcripts").mkdir(exist_ok=True)
    (settings.storage_path / "exports").mkdir(exist_ok=True)


# Extraction categories with descriptions
EXTRACTION_CATEGORIES = {
    # Pain domain
    "emotional_struggles": "How people experience difficult emotions",
    "coping_strategies": "What people do to get through hard times",
    "what_helps_hurts": "Specific things that help or make things worse",
    "vulnerability": "Moments of openness and raw honesty",
    "mental_health_patterns": "Recurring mental health experiences",
    "trauma_recovery": "How people heal from difficult experiences",
    "shame_guilt": "Experiences of shame and guilt",
    "anger_frustration": "How anger manifests and is processed",
    "grief_loss": "Experiences of loss and grieving",
    "fear_anxiety": "Fear and anxiety experiences",
    "depression_hopelessness": "Depression and feelings of hopelessness",

    # Joy domain
    "humor_wit": "How people use humor to connect and cope",
    "joy_celebration": "What brings genuine happiness",
    "excitement_passion": "What people get excited about",
    "playfulness": "Lighthearted moments and fun",
    "gratitude_appreciation": "What people are thankful for",
    "contentment_peace": "Experiences of calm satisfaction",
    "hope_optimism": "Hope and positive outlook",
    "pride_accomplishment": "Pride in achievements",
    "awe_wonder": "Experiences of awe and wonder",

    # Connection domain
    "companionship": "Being with others, shared presence",
    "friendship_dynamics": "How friendships work",
    "romantic_love": "Romantic relationship patterns",
    "family_bonds": "Family relationship dynamics",
    "belonging_community": "Feeling part of something larger",
    "loneliness_isolation": "Experiences of disconnection",
    "parenting": "Parenting experiences and challenges",
    "boundaries": "Setting and maintaining boundaries",
    "conflict_repair": "How conflicts are resolved and relationships repaired",
    "trust_betrayal": "Trust building and betrayal experiences",
    "communication_patterns": "How people communicate in relationships",
    "caregiving": "Caring for others (elderly, sick, etc.)",

    # Growth domain
    "self_discovery": "Learning about oneself",
    "growth_moments": "Turning points and breakthroughs",
    "life_lessons": "Wisdom gained from experience",
    "wisdom_perspective": "Insights about life, often from age/experience",
    "meaning_purpose": "What gives life meaning",
    "regret_forgiveness": "Processing regret and forgiving",
    "life_transitions": "Major life changes (divorce, job loss, moving)",
    "identity_formation": "How people form their sense of self",
    "values_beliefs": "Core values and belief systems",
    "decision_making": "How people make important decisions",

    # Body domain
    "aging_mortality": "Aging experiences and mortality awareness",
    "body_health": "Body image, chronic illness, physical health",
    "rest_burnout": "Rest, exhaustion, and burnout patterns",
    "embodied_emotion": "How emotions manifest in the body",
    "neurodivergent_experience": "ADHD, autism, and other neurodivergent experiences",
    "sleep_energy": "Sleep patterns and energy management",
    "addiction_recovery": "Addiction experiences and recovery",

    # Context domain
    "cultural_identity": "Cultural background and identity",
    "spirituality_faith": "Spiritual and religious experiences",
    "work_career": "Work life, career changes, professional identity",
    "money_scarcity": "Financial stress and abundance",
    "gender_sexuality": "Gender identity and sexuality experiences",
    "creativity_expression": "Creative expression and artistic pursuits",

    # Authenticity domain
    "real_quotes": "Actual words people use to describe experiences",
    "contradictions_complexity": "When people hold conflicting views",
    "messy_middle": "In-progress struggles, not neat resolutions",
    "uncomfortable_truths": "Hard realities people acknowledge",
    "beautiful_imperfection": "Embracing flaws and limitations",
}


# Recommended YouTube channels (from the documentation)
RECOMMENDED_CHANNELS = [
    # Emotional Experience - Awe
    {"name": "The Dictionary of Obscure Sorrows", "category": "awe", "url": "@dictionaryofobscuresorrows"},
    {"name": "Big Think", "category": "wisdom", "url": "@bigthink"},
    {"name": "Pursuit of Wonder", "category": "existential", "url": "@PursuitofWonder"},

    # Emotional Experience - Joy
    {"name": "The School of Life", "category": "wisdom", "url": "@theschooloflifetv"},
    {"name": "Some Good News", "category": "joy", "url": "@somegoodnews"},
    {"name": "Kurzgesagt – In a Nutshell", "category": "wonder", "url": "@kurzgesagt"},

    # Vulnerability & Emotional Depth
    {"name": "Soft White Underbelly", "category": "vulnerability", "url": "@SoftWhiteUnderbelly"},
    {"name": "The Diary Of A CEO", "category": "vulnerability", "url": "@TheDiaryOfACEO"},
    {"name": "Brené Brown", "category": "vulnerability", "url": "@BreneBrownOfficial"},

    # Therapy & Mental Health
    {"name": "Kati Morton", "category": "therapy", "url": "@KatiMorton"},
    {"name": "Dr. Tracey Marks", "category": "therapy", "url": "@DrTraceyMarks"},
    {"name": "Psychology In Seattle", "category": "therapy", "url": "@PsychologyInSeattle"},
    {"name": "Therapy in a Nutshell", "category": "therapy", "url": "@TherapyinaNutshell"},
    {"name": "HealthyGamerGG", "category": "mental_health", "url": "@HealthyGamerGG"},
    {"name": "Cinema Therapy", "category": "therapy", "url": "@CinemaTherapy"},

    # Grief & Loss
    {"name": "The Dinner Party", "category": "grief", "url": "@TheDinnerPartyOrg"},
    {"name": "What's Your Grief", "category": "grief", "url": "@WhatsYourGrief"},
    {"name": "Refuge in Grief", "category": "grief", "url": "@RefugeinGrief"},

    # Relationships & Communication
    {"name": "The Gottman Institute", "category": "relationships", "url": "@TheGottmanInstitute"},
    {"name": "Esther Perel", "category": "relationships", "url": "@EstherPerel"},
    {"name": "Matthew Hussey", "category": "relationships", "url": "@howtogettheguy"},

    # ADHD & Neurodivergence
    {"name": "How to ADHD", "category": "neurodivergent", "url": "@HowtoADHD"},
    {"name": "ADHD Jesse", "category": "neurodivergent", "url": "@ADHDJesse"},
    {"name": "The Aspie World", "category": "neurodivergent", "url": "@TheAspieWorld"},

    # Addiction & Recovery
    {"name": "AfterParty", "category": "addiction", "url": "@AfterPartyCHD"},
    {"name": "Recovery Elevator", "category": "addiction", "url": "@RecoveryElevator"},

    # Aging & Life Transitions
    {"name": "StoryCorps", "category": "wisdom", "url": "@StoryCorps"},
    {"name": "The Moth", "category": "storytelling", "url": "@TheMothStories"},

    # Mindfulness & Somatic
    {"name": "Tara Brach", "category": "mindfulness", "url": "@TaraBrach"},
    {"name": "The Holistic Psychologist", "category": "somatic", "url": "@theholisticpsychologist"},
    {"name": "Irene Lyon", "category": "somatic", "url": "@IreneLyon"},

    # Work & Career
    {"name": "Simon Sinek", "category": "work", "url": "@SimonSinek"},
    {"name": "Adam Grant", "category": "work", "url": "@AdamGrantOfficial"},
]
