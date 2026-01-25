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


# ============================================================================
# RECOMMENDED MOVIES FOR TRAINING
# ============================================================================
# Movies with rich emotional content, authentic human experiences, and
# therapeutic themes. Perfect for training an empathetic AI coach.
# Note: Users need to provide their own movie files (legally obtained)

RECOMMENDED_MOVIES = [
    # --- GRIEF & LOSS ---
    {"title": "Manchester by the Sea", "year": 2016, "category": "grief_loss", "description": "Devastating portrait of grief, guilt, and the inability to forgive oneself. Shows how trauma can freeze a person.", "why_train": "Teaches AI to recognize deep grief that someone can't articulate, and the importance of presence over advice."},
    {"title": "Ordinary People", "year": 1980, "category": "grief_loss", "description": "Family navigating survivor's guilt after a son's death. Includes therapy sessions.", "why_train": "Excellent examples of therapeutic dialogue and family dynamics around unprocessed grief."},
    {"title": "In the Bedroom", "year": 2001, "category": "grief_loss", "description": "Parents dealing with the violent death of their son. Raw, realistic grief.", "why_train": "Shows how grief manifests differently in different people, and how couples can drift apart in pain."},
    {"title": "Rabbit Hole", "year": 2010, "category": "grief_loss", "description": "Couple coping with the accidental death of their child. Includes support group scenes.", "why_train": "Authentic support group dialogue, different coping mechanisms, and the non-linear nature of grief."},

    # --- MENTAL HEALTH & THERAPY ---
    {"title": "Good Will Hunting", "year": 1997, "category": "therapy_mental_health", "description": "Troubled genius works through childhood trauma with therapist. Classic therapy relationship.", "why_train": "Gold standard for therapeutic breakthrough moments. 'It's not your fault' scene is peak emotional validation."},
    {"title": "Silver Linings Playbook", "year": 2012, "category": "therapy_mental_health", "description": "Bipolar disorder, family dysfunction, and finding connection. Realistic medication discussions.", "why_train": "Shows mental illness in relatable context, the messy reality of recovery, and how love/connection can coexist with treatment."},
    {"title": "A Beautiful Mind", "year": 2001, "category": "therapy_mental_health", "description": "Schizophrenia and the challenge of distinguishing reality. Long-term illness management.", "why_train": "Understanding chronic mental illness, the role of support systems, and living with ongoing challenges."},
    {"title": "Girl, Interrupted", "year": 1999, "category": "therapy_mental_health", "description": "Young woman in psychiatric hospital. Group dynamics, diagnosis, identity.", "why_train": "Peer support dynamics, questioning normalcy, the complexity of mental health labels."},

    # --- ADDICTION & RECOVERY ---
    {"title": "Beautiful Boy", "year": 2018, "category": "addiction_recovery", "description": "Father-son relationship through meth addiction. Cycles of relapse and hope.", "why_train": "Teaches the cyclical nature of addiction, family impact, and maintaining love while setting boundaries."},
    {"title": "Requiem for a Dream", "year": 2000, "category": "addiction_recovery", "description": "Multiple addictions and their devastating progression. Unflinching look at rock bottom.", "why_train": "Understanding the progressive nature of addiction and the desperation it creates. Use carefully - intense content."},
    {"title": "28 Days", "year": 2000, "category": "addiction_recovery", "description": "Alcoholic in rehab. Recovery process, group therapy, accountability.", "why_train": "Realistic rehab environment, group therapy dynamics, early recovery challenges."},
    {"title": "Clean and Sober", "year": 1988, "category": "addiction_recovery", "description": "Real estate agent in rehab. Denial, acceptance, and early recovery.", "why_train": "Classic portrayal of denial breaking down, the moment of surrender, AA/NA dynamics."},

    # --- RELATIONSHIPS & COMMUNICATION ---
    {"title": "Marriage Story", "year": 2019, "category": "relationships_love", "description": "Divorce process with still-loving couple. Communication breakdown.", "why_train": "Masterclass in how love can coexist with incompatibility. The argument scene shows escalation patterns."},
    {"title": "Blue Valentine", "year": 2010, "category": "relationships_love", "description": "Relationship shown at beginning and end. How connection erodes.", "why_train": "Understanding relationship deterioration patterns, the gap between intention and impact."},
    {"title": "Revolutionary Road", "year": 2008, "category": "relationships_love", "description": "1950s couple trapped in suburban expectations. Dreams vs. reality.", "why_train": "How unspoken expectations poison relationships, the danger of burying authentic self."},
    {"title": "Eternal Sunshine of the Spotless Mind", "year": 2004, "category": "relationships_love", "description": "Memory erasure after breakup. The value of painful memories.", "why_train": "Teaches that painful experiences have value, and that avoiding pain isn't the same as healing."},

    # --- TRAUMA & HEALING ---
    {"title": "The Perks of Being a Wallflower", "year": 2012, "category": "trauma_healing", "description": "Teen processing repressed trauma. Friendship, belonging, breakthrough.", "why_train": "Shows how trauma surfaces, the power of feeling seen, and breakthrough moments."},
    {"title": "Mystic River", "year": 2003, "category": "trauma_healing", "description": "Childhood trauma affecting adult lives. Three men, interconnected pain.", "why_train": "Long-term effects of childhood trauma, how unprocessed pain ripples through decades."},
    {"title": "Precious", "year": 2009, "category": "trauma_healing", "description": "Abuse survivor finding voice through education and writing. Resilience.", "why_train": "Extreme adversity and the spark of resilience. The power of one person believing in you."},
    {"title": "The Prince of Tides", "year": 1991, "category": "trauma_healing", "description": "Man confronts family secrets through sister's therapist. Repressed memories.", "why_train": "Family secrets, the cost of silence, and how therapy can unearth buried truth."},

    # --- DEPRESSION & SUICIDALITY ---
    {"title": "The Hours", "year": 2002, "category": "therapy_mental_health", "description": "Three women across time dealing with depression. Interconnected stories.", "why_train": "Depression across contexts and eras, the weight of existence, finding reasons to stay."},
    {"title": "Melancholia", "year": 2011, "category": "therapy_mental_health", "description": "Depression portrayed as planetary collision. Artistic depiction of despair.", "why_train": "Visceral understanding of how depression feels from inside. The inability to 'just feel better.'"},
    {"title": "It's Kind of a Funny Story", "year": 2010, "category": "therapy_mental_health", "description": "Teen checks himself into psychiatric ward. Peer support, finding perspective.", "why_train": "Normalizing seeking help, psychiatric hospital as place of healing, peer connection."},

    # --- FAMILY DYNAMICS ---
    {"title": "August: Osage County", "year": 2013, "category": "parenting_family", "description": "Dysfunctional family gathering after death. Generational trauma.", "why_train": "How family patterns repeat, the drama triangle in action, buried resentments surfacing."},
    {"title": "The Squid and the Whale", "year": 2005, "category": "parenting_family", "description": "Divorce through children's eyes. Intellectual parents, emotional neglect.", "why_train": "Impact of divorce on children, how parents unconsciously use children as proxies."},
    {"title": "Boyhood", "year": 2014, "category": "parenting_family", "description": "12 years of a boy's life. Divorce, blended families, growing up.", "why_train": "Realistic family evolution, stepfamily dynamics, the long arc of parenting."},
    {"title": "Kramer vs. Kramer", "year": 1979, "category": "parenting_family", "description": "Custody battle and evolving parenthood. Father learning to parent.", "why_train": "Challenging gender roles in parenting, the cost of divorce on children."},

    # --- IDENTITY & SELF-DISCOVERY ---
    {"title": "Lady Bird", "year": 2017, "category": "life_transitions", "description": "Senior year identity formation. Mother-daughter tension.", "why_train": "Adolescent identity development, the push-pull of parental relationships, finding authentic self."},
    {"title": "Moonlight", "year": 2016, "category": "vulnerability_shame", "description": "Three stages of Black gay man's life. Identity, shame, masculinity.", "why_train": "Identity formation under societal pressure, toxic masculinity, learning to accept oneself."},
    {"title": "Call Me by Your Name", "year": 2017, "category": "relationships_love", "description": "First love, self-discovery, the pain of impermanence.", "why_train": "The father's speech at the end is a masterclass in emotional wisdom about embracing feeling."},

    # --- LONELINESS & CONNECTION ---
    {"title": "Her", "year": 2013, "category": "relationships_love", "description": "Man falls in love with AI. Loneliness, connection, what makes relationships real.", "why_train": "Directly relevant - explores human-AI emotional connection, what we need from relationships."},
    {"title": "Lost in Translation", "year": 2003, "category": "human_stories", "description": "Two lonely people connect briefly. Platonic intimacy, feeling understood.", "why_train": "The power of being truly seen, connection without agenda, meaningful brief encounters."},
    {"title": "Anomalisa", "year": 2015, "category": "therapy_mental_health", "description": "Man who sees everyone as same. Profound alienation and brief connection.", "why_train": "Understanding depersonalization, the desperation for genuine connection, numbness."},

    # --- AGING & MORTALITY ---
    {"title": "Away from Her", "year": 2006, "category": "grief_loss", "description": "Woman with Alzheimer's, husband's journey of letting go.", "why_train": "Anticipatory grief, identity loss, unconditional love in devastating circumstances."},
    {"title": "Amour", "year": 2012, "category": "grief_loss", "description": "Elderly couple facing terminal illness. Love, dignity, hard choices.", "why_train": "End-of-life care, maintaining dignity, the weight of caretaking."},
    {"title": "The Farewell", "year": 2019, "category": "grief_loss", "description": "Family keeps grandmother's diagnosis secret. Cultural differences in death.", "why_train": "Cultural perspectives on truth-telling and death, family dynamics across cultures."},

    # --- NEURODIVERGENCE ---
    {"title": "Rain Man", "year": 1988, "category": "neurodivergence", "description": "Autistic savant and his brother. Understanding difference.", "why_train": "Foundational autism representation. Shows both gifts and challenges of neurodivergence."},
    {"title": "Temple Grandin", "year": 2010, "category": "neurodivergence", "description": "Autistic scientist's life. Different thinking as strength.", "why_train": "Neurodivergence as different, not less. Finding ways to thrive by leaning into difference."},
    {"title": "Adam", "year": 2009, "category": "neurodivergence", "description": "Man with Asperger's navigating romance. Social challenges, authenticity.", "why_train": "Relationship challenges with neurodivergence, the beauty of direct communication."},
]
