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


# Recommended YouTube channels (from MoodLeaf interview processor)
# Curated for MoodLeaf ethos: warm honesty, anti-toxic-positivity, full human experience,
# embraces messy middle, non-clinical, pro-human-connection, neurodiversity aware
RECOMMENDED_CHANNELS = [
    # ══════════════════════════════════════════════════════════════════════════════
    # EMOTIONAL EXPERIENCE
    # ══════════════════════════════════════════════════════════════════════════════

    # --- Awe & Wonder ---
    {"name": "The School of Life", "url": "@theschooloflife", "channel_id": "UC7IcJI8PUf5Z3zKxnZvTBog", "category": "philosophy_meaning", "trust": "high", "description": "Alain de Botton - philosophy for everyday emotional life"},
    {"name": "Shots of Awe", "url": "@ShotsOfAwe", "channel_id": "UClYb9NpXnRemxYoWbcYANsA", "category": "philosophy_meaning", "trust": "high", "description": "Jason Silva - micro-documentaries on wonder, consciousness"},

    # --- Joy & Delight ---
    {"name": "SoulPancake", "url": "@soulpancake", "channel_id": "UCvddZU4j9oalKOxCJ0IuNyg", "category": "joy_celebration", "trust": "high", "description": "Uplifting content about human connection, joy, and meaning"},
    {"name": "The Holderness Family", "url": "@TheHoldernessFamily", "channel_id": "UCjMgq_nGK5dg6pVDvH5LW8Q", "category": "humor_comedy", "trust": "medium", "description": "Parenting humor, relatable family chaos"},

    # --- Playfulness & Spontaneity ---
    {"name": "Yes Theory", "url": "@YesTheory", "channel_id": "UCvK4bOhULCpmLabd2pDMtnA", "category": "philosophy_meaning", "trust": "high", "description": "Seek discomfort - embracing uncertainty, spontaneous connection"},

    # --- Gratitude & Appreciation ---
    {"name": "StoryCorps", "url": "@storycorps", "channel_id": "UCBYXhmHfUOpb9TYuPpVzFWA", "category": "elderly_wisdom", "trust": "high", "description": "Ordinary people's stories - gratitude, love, appreciation"},

    # --- Love & Compassion ---
    {"name": "Esther Perel", "url": "@estherperel", "channel_id": "UCyktTJjKdR81Cv9sMXK5QCA", "category": "relationships_love", "trust": "high", "description": "Love as complex & contradictory. 'Where Do We Begin'"},
    {"name": "The Gottman Institute", "url": "@gottmaninstitute", "channel_id": "UCWxbz64r6vI7E2awwc8apLQ", "category": "relationships_love", "trust": "high", "description": "John Gottman - research-based love, compassion in relationships"},
    {"name": "Tara Brach", "url": "@TaraBrach", "channel_id": "UCxNFlBjJtHXLhHIkqxzJ7Tw", "category": "philosophy_meaning", "trust": "high", "description": "Radical self-compassion, loving kindness, mindfulness"},

    # --- Vulnerability & Openness ---
    {"name": "Brené Brown", "url": "@BreneBrown", "channel_id": "UCpLsVgZrECIhPdJJCxyNRlQ", "category": "vulnerability_authenticity", "trust": "high", "description": "Vulnerability research, courage, authenticity"},
    {"name": "Diary of a CEO", "url": "@TheDiaryOfACEO", "channel_id": "UCGq-a57w-aPwyi3pW7XLiHw", "category": "vulnerability_authenticity", "trust": "high", "description": "Deep conversations on failure, vulnerability, raw truth"},
    {"name": "Lewis Howes", "url": "@LewisHowes", "channel_id": "UCQjBpfPj72zwYFpS7U7gd_A", "category": "vulnerability_authenticity", "trust": "high", "description": "School of Greatness - men's vulnerability, emotional openness"},

    # --- Fear & Anxiety ---
    {"name": "Therapy in a Nutshell", "url": "@TherapyinaNutshell", "channel_id": "UCpuKvNRyiFKC4Cgz5bulHjg", "category": "therapy_mental_health", "trust": "high", "description": "Licensed LMFT - anxiety, fear, evidence-based mental health"},
    {"name": "Kati Morton", "url": "@KatiMorton", "channel_id": "UCzBYOHyEEzlkRdDOSobbpvw", "category": "therapy_mental_health", "trust": "high", "description": "Licensed therapist - anxiety, fear, accessible mental health"},
    {"name": "The Anxiety Guy", "url": "@TheAnxietyGuy", "channel_id": "UCrJ9_a2zUNnVRvAq-OPuxgQ", "category": "therapy_mental_health", "trust": "high", "description": "Dennis Simsek - anxiety recovery, fear confrontation"},

    # --- Anger & Frustration ---
    {"name": "Psychology In Seattle", "url": "@PsychologyInSeattle", "channel_id": "UCVQXbB1rSYdPb2boNNpu3og", "category": "therapy_mental_health", "trust": "high", "description": "Dr. Kirk Honda - anger, frustration, nuanced emotional analysis"},

    # --- Shame & Guilt ---
    {"name": "Dr. Ramani", "url": "@DoctorRamani", "channel_id": "UC9Qixc77KhCo88E5gMs-caQ", "category": "therapy_mental_health", "trust": "high", "description": "Shame, guilt, narcissistic abuse recovery, healing"},

    # --- Grief & Sorrow ---
    {"name": "Refuge in Grief", "url": "@RefugeinGrief", "channel_id": "UCwzQ3DPTgKmE6GUmfWuFxkQ", "category": "therapy_mental_health", "trust": "high", "description": "Megan Devine - grief that doesn't need fixing, anti-toxic positivity"},
    {"name": "The Grief Recovery Method", "url": "@GriefRecoveryMethod", "channel_id": "UCiE6-nB-c9qB5n0f3Cq1uRQ", "category": "therapy_mental_health", "trust": "high", "description": "Evidence-based grief recovery, practical tools"},
    {"name": "What's Your Grief", "url": "@WhatsYourGrief", "channel_id": "UCmQcjPmjwB7QmHM_NiP3EQg", "category": "therapy_mental_health", "trust": "high", "description": "Practical grief education, normalizing all types of loss"},
    {"name": "Nora McInerny", "url": "@NoraMcInerny", "channel_id": "UC0aCvDr7E_Cvq0KHB3FQXpg", "category": "therapy_mental_health", "trust": "high", "description": "Terrible, Thanks for Asking - grief with humor and honesty"},

    # --- Calm & Contentment ---
    {"name": "Michael Sealey", "url": "@MichaelSealey", "channel_id": "UC9GoqsWjluXVSKHO4Wistbw", "category": "therapy_mental_health", "trust": "high", "description": "Guided meditations, hypnotherapy, deep relaxation"},
    {"name": "The Honest Guys", "url": "@thehonestguys", "channel_id": "UC7tD6Ifrwbiy-BoaAHEinmQ", "category": "therapy_mental_health", "trust": "high", "description": "Guided meditations, calm, sleep stories"},
    {"name": "Jason Stephenson", "url": "@JasonStephensonSleep", "channel_id": "UCqDBSTeuGa1e3MSqG_nq2Uw", "category": "therapy_mental_health", "trust": "high", "description": "Sleep meditation, peace, anxiety relief"},

    # ══════════════════════════════════════════════════════════════════════════════
    # COGNITIVE PATTERNS
    # ══════════════════════════════════════════════════════════════════════════════

    # --- Ambiguity & Uncertainty ---
    {"name": "Vsauce", "url": "@Vsauce", "channel_id": "UC6nSFpj9HTCZ5t-N3Rm3-HA", "category": "philosophy_meaning", "trust": "high", "description": "Michael Stevens - embracing uncertainty, existential curiosity"},
    {"name": "Veritasium", "url": "@veritasium", "channel_id": "UCHnyfMqiRRG1u-2MsSQLbXA", "category": "philosophy_meaning", "trust": "high", "description": "Derek Muller - uncertainty in science, changing one's mind"},

    # --- Cognitive Flow & Rhythm ---
    {"name": "How to ADHD", "url": "@HowtoADHD", "channel_id": "UC-nPM1_kSZf91ZGkcgy_95Q", "category": "neurodivergence", "trust": "high", "description": "Jessica McCabe - ADHD cognitive patterns, flow states, rhythms"},
    {"name": "Purple Ella", "url": "@PurpleElla", "channel_id": "UCvj7WmANb1VdDwPv_L0D4ag", "category": "neurodivergence", "trust": "high", "description": "Autism + ADHD - different cognitive rhythms, authentic experience"},

    # --- Perspective & Worldview ---
    {"name": "Contrapoints", "url": "@ContraPoints", "channel_id": "UCNvsIonJdJ5E4EXMa65VYpA", "category": "philosophy_meaning", "trust": "high", "description": "Natalie Wynn - philosophy, perspective shifts, nuance"},
    {"name": "Philosophy Tube", "url": "@PhilosophyTube", "channel_id": "UC2PA-AKmVpU6NKCGtZq_rKQ", "category": "philosophy_meaning", "trust": "high", "description": "Abigail Thorn - philosophy, changing worldviews, identity"},

    # ══════════════════════════════════════════════════════════════════════════════
    # EXISTENTIAL THEMES
    # ══════════════════════════════════════════════════════════════════════════════

    # --- Identity & Selfhood ---
    {"name": "Jammidodger", "url": "@Jammidodger", "channel_id": "UCXc4jQMOy2wvVo_jK1EuLSQ", "category": "vulnerability_authenticity", "trust": "high", "description": "Trans identity journey - discovering and becoming oneself"},
    {"name": "Thais Gibson", "url": "@PersonalDevelopmentSchool", "channel_id": "UCHQ4lSAu7jQXmVN3MPCPZGQ", "category": "relationships_love", "trust": "high", "description": "Attachment theory, identity patterns, self-discovery"},

    # --- Meaning & Purpose ---
    {"name": "The Minimalists", "url": "@TheMinimalists", "channel_id": "UCRPrmdh5FLt4bxWgvQ8SWOg", "category": "philosophy_meaning", "trust": "high", "description": "Joshua & Ryan - meaning over materialism, intentional living"},
    {"name": "Victor Frankl Institute", "url": "@ViktorFranklInstitute", "channel_id": "UCNqv3JbxGJ0gZ_fZG_QXLjw", "category": "philosophy_meaning", "trust": "high", "description": "Man's Search for Meaning - logotherapy, finding purpose"},
    {"name": "Academy of Ideas", "url": "@AcademyofIdeas", "channel_id": "UCiRiQGCHGjDLT9FQXFW0I3A", "category": "philosophy_meaning", "trust": "high", "description": "Philosophy for life - meaning, purpose, existentialism"},

    # --- Growth & Personal Development ---
    {"name": "Mel Robbins", "url": "@melrobbins", "channel_id": "UCk2U-Oqn7RXf-ydPqfSxG5g", "category": "vulnerability_authenticity", "trust": "high", "description": "Personal growth without toxic positivity, science-backed"},
    {"name": "Rich Roll", "url": "@richroll", "channel_id": "UCOF0J3ms6IeZZCOp-jJMuXQ", "category": "vulnerability_authenticity", "trust": "high", "description": "Transformation, addiction recovery, personal evolution"},

    # --- Transformation & Change ---
    {"name": "Gabor Maté", "url": "@DrGaborMate", "channel_id": "UC6JLfDwuqC6OmJAqVVn5f7w", "category": "addiction_recovery", "trust": "high", "description": "Trauma-informed transformation, compassionate change"},
    {"name": "Annie Grace", "url": "@ThisNakedMind", "channel_id": "UCDSEuXPwLJh4zLrVbYXj0Nw", "category": "addiction_recovery", "trust": "high", "description": "This Naked Mind - alcohol freedom, identity transformation"},

    # --- Mortality & Death Awareness ---
    {"name": "Ask a Mortician", "url": "@AskAMortician", "channel_id": "UCi5iiEyLwSLvlqnMi02u5gQ", "category": "philosophy_meaning", "trust": "high", "description": "Caitlin Doughty - death positivity, confronting mortality honestly"},
    {"name": "Ram Dass", "url": "@RamDassOrg", "channel_id": "UCrmD3-ZZTJRfxAOxS1LHkkQ", "category": "philosophy_meaning", "trust": "high", "description": "Be Here Now - aging, dying, consciousness, acceptance"},

    # --- Hope & Despair ---
    {"name": "The Moth", "url": "@TheMoth", "channel_id": "UCkVMpFPDK1F67eCM60ICAVQ", "category": "storytelling_human_experience", "trust": "high", "description": "True stories - the full spectrum from despair to hope"},
    {"name": "Humans of New York", "url": "@HumansofNewYork", "channel_id": "UCQvJR3UyQ8K-TrVz0rENKxg", "category": "storytelling_human_experience", "trust": "high", "description": "Real human stories - struggles, hope, resilience"},

    # ══════════════════════════════════════════════════════════════════════════════
    # RELATIONAL DYNAMICS
    # ══════════════════════════════════════════════════════════════════════════════

    # --- Connection & Belonging ---
    {"name": "NVC Marshall Rosenberg", "url": "@NonviolentCommunicationNVC", "channel_id": "UC2iuX2CG6jgCgHVfMM7w3Yw", "category": "relationships_love", "trust": "high", "description": "Nonviolent Communication - deep connection through needs"},

    # --- Isolation & Loneliness ---
    {"name": "Kurzgesagt", "url": "@Kurzgesagt", "channel_id": "UCsXVk37bltHxD1rDPwtNM8Q", "category": "philosophy_meaning", "trust": "high", "description": "In a Nutshell - loneliness, isolation, existential themes"},
    {"name": "HealthyGamerGG", "url": "@HealthyGamerGG", "channel_id": "UClHVl2N3jPEbkNJVx-ItQIQ", "category": "therapy_mental_health", "trust": "high", "description": "Dr. K - isolation, gaming culture, mental health"},

    # --- Conflict & Discord ---
    {"name": "TED Talks", "url": "@TED", "channel_id": "UCAuUUnT6oDeKwE6v1NGQxug", "category": "philosophy_meaning", "trust": "high", "description": "Ideas worth spreading - conflict resolution, understanding"},

    # --- Caregiving & Nurturance ---
    {"name": "Dr. Becky Kennedy", "url": "@drbeckyatgoodinside", "channel_id": "UC2oF2TmQVzRCW3M6BQmwEFQ", "category": "relationships_love", "trust": "high", "description": "Good Inside - parenting as caregiving, nurturing connection"},
    {"name": "Janet Lansbury", "url": "@JanetLansbury", "channel_id": "UC-pMWdv3GhJIBmYqAJWBQfQ", "category": "relationships_love", "trust": "high", "description": "RIE parenting - respectful caregiving, trust"},
    {"name": "Teepa Snow", "url": "@TeepaSnow", "channel_id": "UCmqMv7z9YqQf_J7bqMzPr1w", "category": "relationships_love", "trust": "high", "description": "Dementia caregiving - compassionate care, understanding"},

    # --- Empathy & Understanding ---
    {"name": "Andrew Huberman", "url": "@hubermanlab", "channel_id": "UC2D2CMWXMOVWx7giW1n3LIg", "category": "therapy_mental_health", "trust": "high", "description": "Neuroscience of empathy, connection, understanding others"},

    # ══════════════════════════════════════════════════════════════════════════════
    # SYMBOLIC EXPRESSION
    # ══════════════════════════════════════════════════════════════════════════════

    # --- Metaphoric Language & Symbolic Imagery ---
    {"name": "Nerdwriter", "url": "@Nerdwriter1", "channel_id": "UCJkMlOu7faDgqh4PfzbpLdg", "category": "philosophy_meaning", "trust": "high", "description": "Video essays on art, metaphor, meaning in culture"},
    {"name": "The Art Assignment", "url": "@theartassignment", "channel_id": "UCmQThz1OLYt8mb2PaGJSJeQ", "category": "philosophy_meaning", "trust": "high", "description": "Art as emotional expression, symbolic meaning"},

    # --- Archetypal & Mythic Themes ---
    {"name": "Joseph Campbell Foundation", "url": "@JosephCampbellFdn", "channel_id": "UCq6v1HuYQ6m4d9PVcA0rqPQ", "category": "philosophy_meaning", "trust": "high", "description": "Hero's journey, myth, archetypal psychology"},

    # ══════════════════════════════════════════════════════════════════════════════
    # TEMPORAL & NARRATIVE PATTERNS
    # ══════════════════════════════════════════════════════════════════════════════

    # --- Narrative Arc / Personal Journey ---
    {"name": "Soft White Underbelly", "url": "@SoftWhiteUnderbelly", "channel_id": "UCCvcd0FYi58LwyTQP8MYTgg", "category": "storytelling_human_experience", "trust": "high", "description": "Mark Laita - raw life stories, personal journeys, humanity"},
    {"name": "Special Books by Special Kids", "url": "@SpecialBooksbySpecialKids", "channel_id": "UC4E98HDsPXrf5kTKIgrSmtQ", "category": "storytelling_human_experience", "trust": "high", "description": "Chris Ulmer - stories of disability, difference, humanity"},

    # --- Temporal Focus (Past, Present, Future) ---
    {"name": "Eckhart Tolle", "url": "@EckhartTolle", "channel_id": "UCJ9rg3_ApZFpfIR0vftNPAA", "category": "philosophy_meaning", "trust": "high", "description": "Present moment awareness, releasing past and future"},

    # ══════════════════════════════════════════════════════════════════════════════
    # LIFE CONTEXT (STAGES & TRANSITIONS)
    # ══════════════════════════════════════════════════════════════════════════════

    # --- Birth & New Beginnings ---
    {"name": "The Birth Hour", "url": "@TheBirthHour", "channel_id": "UCt1FgWrRWzYj_r3z0MWMtDA", "category": "storytelling_human_experience", "trust": "high", "description": "Birth stories - new beginnings, transformation"},

    # --- Aging & Life Stages ---
    {"name": "Sixty and Me", "url": "@SixtyandMe", "channel_id": "UCuEb_KLhBhZ_fQVZMbR2EJw", "category": "elderly_wisdom", "trust": "high", "description": "Women over 60 - embracing aging, wisdom"},

    # --- Rupture (Breakdown or Crisis) ---
    {"name": "After Prison Show", "url": "@AfterPrisonShow", "channel_id": "UCo2LGlvPwPJ_vD-dN8FdT8w", "category": "addiction_recovery", "trust": "high", "description": "Joe Guerrero - life after rupture, rebuilding from crisis"},
    {"name": "Recovery Elevator", "url": "@RecoveryElevator", "channel_id": "UChvKBUy9eLU-5xVz2Rre7-g", "category": "addiction_recovery", "trust": "high", "description": "Alcohol crisis and recovery, community support"},
    {"name": "Club Soda", "url": "@ClubSodaUK", "channel_id": "UC8oCJLZ_DLu7e5Qu3qbqRQw", "category": "addiction_recovery", "trust": "high", "description": "Mindful drinking, harm reduction, choice"},

    # ══════════════════════════════════════════════════════════════════════════════
    # EMBODIED EXPERIENCE
    # ══════════════════════════════════════════════════════════════════════════════

    # --- Vitality & Aliveness ---
    {"name": "Yoga With Adriene", "url": "@yogawithadriene", "channel_id": "UCFKE7WVJfvaHW5q283SxchA", "category": "therapy_mental_health", "trust": "high", "description": "Embodied practice, vitality, movement as healing"},

    # --- Tension & Relaxation ---
    {"name": "The Body Keeps the Score", "url": "@BesselVanDerKolk", "channel_id": "UCQ2GfCOybQWdtcA0qVaM1aw", "category": "therapy_mental_health", "trust": "high", "description": "Bessel van der Kolk - trauma in the body, somatic healing"},

    # --- Chronic Illness & Disability ---
    {"name": "Jessica Kellgren-Fozard", "url": "@JessicaKellgrenFozard", "channel_id": "UCqZ3eDbxCaKBnE9W6w7xRGg", "category": "vulnerability_authenticity", "trust": "high", "description": "Deaf, disabled LGBTQ+ - joy and chronic illness coexist"},
    {"name": "Invisible i", "url": "@invisiblei", "channel_id": "UCy0f7VLjz7L_rkF1pePJaOg", "category": "vulnerability_authenticity", "trust": "high", "description": "Chronic illness, invisible disability, lived experience"},

    # ══════════════════════════════════════════════════════════════════════════════
    # IDENTITY & DIVERSITY
    # ══════════════════════════════════════════════════════════════════════════════

    # --- LGBTQ+ Experience ---
    {"name": "Ash Hardell", "url": "@AshHardell", "channel_id": "UCnIX4jtXbqEwb8kEU3blzlg", "category": "vulnerability_authenticity", "trust": "high", "description": "Non-binary, queer identity journey, education"},

    # --- Cultural & Racial Identity ---
    {"name": "Jay Shetty", "url": "@JayShetty", "channel_id": "UCbV60AGIHKz3xMfY3TdvLsQ", "category": "philosophy_meaning", "trust": "high", "description": "Former monk - wisdom traditions, cross-cultural meaning"},

    # --- Neurodivergent Experience ---
    {"name": "Yo Samdy Sam", "url": "@YoSamdySam", "channel_id": "UCwVr5NHzQ4GqPuvViLoXLgw", "category": "neurodivergence", "trust": "high", "description": "Autism, late diagnosis, neurodivergent identity"},
    {"name": "The Aspie World", "url": "@TheAspieWorld", "channel_id": "UCkpYu4pKJWY2PLe7a6o7G6A", "category": "neurodivergence", "trust": "high", "description": "Dan Jones - autism, ADHD, neurodivergent experience"},
]
