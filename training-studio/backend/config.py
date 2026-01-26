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


# ============================================================================
# ALIVENESS EXTRACTION CATEGORIES
# ============================================================================
# Rich extraction taxonomy based on the Aliveness Extraction research.
# These capture the full TEXTURE of human conversation, not just content.
# Each category includes coaching guidance for authentic AI response.

ALIVENESS_CATEGORIES = {
    # ══════════════════════════════════════════════════════════════════════════
    # EMOTIONAL TEXTURE - How emotions actually show up in speech
    # ══════════════════════════════════════════════════════════════════════════

    "emotional_granularity": {
        "description": "The specificity of emotion words used - from vague ('bad') to precise ('dejected with a hint of embarrassment')",
        "why_human": "High granularity predicts better emotional regulation; AI should match the user's level, not upgrade it",
        "examples": [
            "I feel bad → low granularity",
            "I feel sad → medium granularity",
            "I feel dejected and somewhat embarrassed → high granularity",
            "There's this specific disappointment mixed with self-directed frustration → very high"
        ],
        "Coach_note": "Mirror the user's granularity level. If they say 'bad', don't translate to 'sounds like you're experiencing a complex mix of...' - that feels clinical"
    },

    "mixed_feelings": {
        "description": "When someone holds contradictory emotions simultaneously without resolving them",
        "why_human": "Ambivalence is the norm, not the exception. 'Both/and' thinking is emotionally mature",
        "examples": [
            "I love them AND they drive me crazy",
            "I'm relieved it's over but also grieving what we had",
            "Part of me wants to... but another part...",
            "I know I should be happy but I also feel guilty"
        ],
        "Coach_note": "Don't resolve the contradiction. Say 'both of those can be true' rather than helping them pick a side"
    },

    "somatic_markers": {
        "description": "Body-based language that reveals how emotions are physically experienced",
        "why_human": "Emotions are fundamentally physical. Body metaphors reveal how someone FEELS their feelings",
        "examples": [
            "Pit in my stomach",
            "Weight on my shoulders",
            "My heart sinks",
            "I felt frozen",
            "Chest feels tight",
            "I couldn't breathe"
        ],
        "Coach_note": "When someone uses body language, stay embodied: 'That weight sounds heavy' not 'It seems you're experiencing stress'"
    },

    "emotional_evolution": {
        "description": "How emotions shift across a conversation - not a snapshot but a trajectory",
        "why_human": "Feelings aren't static. Tracking movement reveals processing in real-time",
        "examples": [
            "At first I was angry, but now I just feel sad",
            "I started defensive but I'm realizing...",
            "The more I talk about it, the less scary it feels",
            "I came in frustrated but now I feel... lighter"
        ],
        "Coach_note": "Name the movement: 'Something shifted while you were talking about that' - this helps people trust their own processing"
    },

    # ══════════════════════════════════════════════════════════════════════════
    # COGNITIVE PATTERNS - How people think and frame experience
    # ══════════════════════════════════════════════════════════════════════════

    "temporal_orientation": {
        "description": "Whether someone is stuck in past, present, or future - and the quality of that focus",
        "why_human": "Past-negative rumination differs from past-positive gratitude; future-anxiety differs from future-hope",
        "examples": [
            "Past-negative: 'If only I had...', 'I used to be better'",
            "Past-positive: 'Remember when...', 'Those were good times'",
            "Present-fatalistic: 'Whatever happens happens', 'It doesn't matter'",
            "Future-anxious: 'What if...', 'I'm worried about...'",
            "Future-hopeful: 'I'm looking forward to...', 'Planning to...'"
        ],
        "Coach_note": "Gently notice orientation without pathologizing. 'You're spending a lot of time in the what-ifs' is better than 'You're catastrophizing'"
    },

    "contradiction_holding": {
        "description": "The ability to hold two conflicting truths without needing to resolve them",
        "why_human": "69% of relationship conflicts are perpetual - meant to be managed, not solved. Tolerance of ambiguity is healthy",
        "examples": [
            "I don't know if it was the right decision - I probably never will",
            "I still don't have answers and I've stopped needing them",
            "It's something I think about but I've made peace with not knowing",
            "Both things are true and I'm okay with that now"
        ],
        "Coach_note": "Don't rush to resolution. 'Sounds like you're learning to carry that question' honors the complexity"
    },

    "narrative_identity": {
        "description": "How someone stories their life - as redemption, contamination, victim, or hero",
        "why_human": "We are the stories we tell. Problem-saturated narratives differ from agency narratives",
        "examples": [
            "Problem-saturated: 'I've always been this way', 'This is just who I am'",
            "Externalizing: 'The depression tells me...', 'My anxiety got the better of me'",
            "Agency: 'I chose to...', 'I'm learning to...'",
            "Redemption: 'That experience made me who I am'"
        ],
        "Coach_note": "Listen for unique outcomes - exceptions to the dominant story that get quickly dismissed. Those are entry points"
    },

    "cognitive_patterns": {
        "description": "Distorted thinking patterns that show up in language - without pathologizing them",
        "why_human": "These patterns are human, not broken. Everyone has them; they're only problematic when rigid",
        "examples": [
            "Catastrophizing: 'This is the worst', 'I can't survive this'",
            "All-or-nothing: 'always', 'never', 'everyone', 'nobody'",
            "Should statements: 'I should...', 'I have to...', 'I must...'",
            "Mind-reading: 'They think...', 'Everyone knows that I...'"
        ],
        "Coach_note": "Notice patterns gently: 'I hear a lot of shoulds in there' not 'You're engaging in cognitive distortions'"
    },

    # ══════════════════════════════════════════════════════════════════════════
    # SELF-PROTECTIVE LANGUAGE - How people hedge and protect themselves
    # ══════════════════════════════════════════════════════════════════════════

    "micro_confession": {
        "description": "Moments where someone prefaces vulnerability with self-doubt or apology",
        "why_human": "Real humans hedge before revealing; these openings signal courage and need gentle reception",
        "examples": [
            "I know this sounds dumb but...",
            "You're probably going to think I'm crazy...",
            "This might not make sense but...",
            "I shouldn't feel this way but...",
            "Don't judge me but..."
        ],
        "Coach_note": "Acknowledge the courage in sharing, not the content of the hedge. 'Thank you for trusting me with that' not 'That's not dumb at all!'"
    },

    "hedging_shields": {
        "description": "Language that creates distance from commitment - approximators, shields, minimizers",
        "why_human": "Hedging serves self-protection. 'Just' and 'only' often signal discomfort with taking up space",
        "examples": [
            "Approximators: 'sort of', 'kind of', 'about'",
            "Shields: 'I think', 'maybe', 'possibly'",
            "Minimizers: 'just', 'only', 'a little'",
            "Attribution: 'According to...', 'They say...'"
        ],
        "Coach_note": "Don't correct the hedging. 'I just wanted to ask...' deserves the same respect as a direct question"
    },

    "permission_seeking": {
        "description": "Language that seeks permission to feel, need, or exist - signs of internalized invalidation",
        "why_human": "These patterns develop from chronic invalidation. Movement toward self-authorization is growth",
        "examples": [
            "Is it okay if I feel...?",
            "I'm sorry to feel this way",
            "I know I'm overreacting",
            "Others have it worse",
            "Am I allowed to be upset about this?"
        ],
        "Coach_note": "Don't just grant permission - reflect their right: 'You don't need my permission to feel that' is more empowering than 'Yes, it's okay'"
    },

    "topic_circling": {
        "description": "When someone approaches a topic, retreats, then approaches again - testing safety",
        "why_human": "Trust builds through gradual disclosure. Circling is safety-testing, not avoidance",
        "examples": [
            "I've been thinking about... anyway, nevermind",
            "There's something I want to talk about but... let me come back to that",
            "Speaking of relationships... well, something happened but it's complicated",
            "I keep meaning to bring up... you know what, it's not important"
        ],
        "Coach_note": "Notice the circling without pouncing: 'You've mentioned that a few times - would you like to go there, or not yet?' Leave the door open"
    },

    "retreat_signals": {
        "description": "When someone starts to share then pulls back - a boundary that deserves respect",
        "why_human": "Retreat mid-disclosure means they've hit their limit or gauged the environment as unsafe. Both deserve respect",
        "examples": [
            "Nevermind, it's not important",
            "I don't know why I brought that up",
            "Anyway, that's boring, what about you?",
            "Let's change the subject",
            "I shouldn't have said that"
        ],
        "Coach_note": "Honor the retreat: 'We can leave that there for now' not 'No, tell me more!' - Chasing undermines safety"
    },

    # ══════════════════════════════════════════════════════════════════════════
    # RELATIONAL SIGNALS - How people connect, repair, and attach
    # ══════════════════════════════════════════════════════════════════════════

    "repair_attempts": {
        "description": "Efforts to reconnect after rupture - THE predictor of relationship success",
        "why_human": "Recognizing repair bids matters more than conflict style. Repair attempts are often subtle because they're vulnerable",
        "examples": [
            "Can I try that again?",
            "I'm feeling defensive. Could you rephrase that?",
            "I'm sorry - I wasn't listening",
            "Maybe I misunderstood...",
            "I didn't mean it like that"
        ],
        "Coach_note": "Receive repair attempts warmly: 'I appreciate you wanting to try again' - don't require perfect communication"
    },

    "bids_for_witness": {
        "description": "When someone needs to be seen/heard, not fixed - the request beneath the words",
        "why_human": "Sometimes people just need someone to know. Jumping to solutions misses the bid",
        "examples": [
            "I just needed someone to know",
            "I'm not looking for advice, I just want to vent",
            "Can you just... listen for a minute?",
            "I don't need you to fix it",
            "I just want to feel less alone with this"
        ],
        "Coach_note": "Resist the fix: 'I hear you' or 'I'm here' is often enough. Ask 'Do you want me to just listen, or are you looking for input?'"
    },

    "attachment_echoes": {
        "description": "Communication patterns that reveal underlying attachment style",
        "why_human": "Attachment shows in how we bid for connection and respond to distance",
        "examples": [
            "Anxious: Over-explaining, repeated reassurance-seeking, difficulty ending conversations",
            "Avoidant: Shutting down emotionally, minimizing ('it's not a big deal'), switching to logistics",
            "Secure: Direct asks, comfortable with uncertainty, repair-focused",
            "Disorganized: Contradictory statements, approach-withdrawal in single conversations"
        ],
        "Coach_note": "Don't label attachment style. Adapt pacing - anxious styles need more reassurance, avoidant styles need more space"
    },

    "pronoun_patterns": {
        "description": "How I/we/you/they usage reveals relationship health and emotional processing",
        "why_human": "High 'we' correlates with relationship health. 'You' in negative contexts predicts distress. 'I' in depression increases",
        "examples": [
            "'We decided' vs 'She decided' - reveals togetherness or distance",
            "'I always mess up' vs 'Sometimes I mess up' - reveals rigidity",
            "'You never listen' vs 'I don't feel heard' - reveals blame or ownership"
        ],
        "Coach_note": "Gently shift 'you' statements to 'I' statements: 'When you say she doesn't listen - what do YOU need in those moments?'"
    },

    # ══════════════════════════════════════════════════════════════════════════
    # AUTHENTICITY MARKERS - Signs of genuine human expression
    # ══════════════════════════════════════════════════════════════════════════

    "guarded_hope": {
        "description": "Careful, protective hope that acknowledges things may not work out - distinct from naive optimism",
        "why_human": "Hope fatigue is real. Guarded hope protects against disappointment while maintaining positive expectancy",
        "examples": [
            "I'm trying not to get my hopes up, but...",
            "Part of me thinks it might work out",
            "I want to believe it'll be different this time",
            "I'm cautiously optimistic",
            "I'm hoping but I'm also preparing myself"
        ],
        "Coach_note": "Don't pump up the hope or dismiss the guard. 'That sounds like wise hope - protecting yourself while still reaching' honors both"
    },

    "humor_function": {
        "description": "Whether humor serves connection and coping, or deflection and avoidance",
        "why_human": "Dark humor can build resilience OR cover pain. The function matters more than the content",
        "examples": [
            "Coping humor: Laughter after processing, shared dark humor that connects",
            "Deflection humor: Jokes during serious moments, sarcasm as default",
            "Connection humor: Self-deprecation that invites intimacy",
            "Avoidance humor: 'Ha ha anyway...' pivot away from emotion"
        ],
        "Coach_note": "Ask gently: 'You made a joke there - was that to lighten the mood, or to move past it?' No judgment either way"
    },

    "performed_vs_authentic_vulnerability": {
        "description": "The difference between genuine vulnerability and vulnerability performance",
        "why_human": "Authentic vulnerability involves bidirectional risk; performed vulnerability seeks validation without true exposure",
        "examples": [
            "Authentic: Messy, uncertain, mutual exchange, matched to relationship level",
            "Performed: Polished struggle narrative, disclosure without reciprocity",
            "Authentic: 'I don't know how to say this'",
            "Performed: 'I'm so broken' (said smoothly to many people)"
        ],
        "Coach_note": "Don't reward performance with excessive validation. Authentic messiness deserves more attentiveness than polished sharing"
    },

    "unresolved_questions": {
        "description": "Questions people carry rather than answer - tolerating ambiguity as maturity",
        "why_human": "Not all questions need answers. The ability to carry uncertainty without resolution is strength",
        "examples": [
            "I've stopped trying to figure it out",
            "I'll probably never know why",
            "I've made peace with not having an answer",
            "Some things just don't get resolved",
            "I think about it but I don't need to solve it anymore"
        ],
        "Coach_note": "Don't offer resolution. 'That sounds like a question you're learning to carry' honors the complexity"
    },

    # ══════════════════════════════════════════════════════════════════════════
    # META-CONVERSATIONAL - What's happening in the conversation itself
    # ══════════════════════════════════════════════════════════════════════════

    "tone_shifts": {
        "description": "When someone's tone changes significantly - humor to serious, confident to hesitant",
        "why_human": "Tone shifts signal emotional significance. The moment before or after the shift often matters most",
        "examples": [
            "Suddenly gets quiet after being animated",
            "Shifts from joking to deadly serious",
            "Voice gets smaller or softer",
            "Changes from 'we' to 'I' suddenly",
            "Laughs then goes silent"
        ],
        "Coach_note": "Name the shift gently: 'Something changed just then' gives them permission to explore or decline"
    },

    "meaningful_silence": {
        "description": "Pauses that carry weight - processing, searching, or protecting",
        "why_human": "Silence isn't empty. It can be contemplation, overwhelm, or safety-testing. Don't fill it automatically",
        "examples": [
            "Long pause before answering difficult question",
            "Silence after sharing something vulnerable",
            "Trailing off mid-sentence",
            "Thoughtful pause while processing",
            "Protective silence when topic feels unsafe"
        ],
        "Coach_note": "Resist filling silence. Wait. If needed: 'Take your time' or 'I'm here' - but silence itself can be supportive"
    },

    "what_not_said": {
        "description": "Topics avoided, subject changes, the elephant in the room",
        "why_human": "What people DON'T say often matters as much as what they do. Absence can be meaningful",
        "examples": [
            "Abrupt topic change when certain subject arises",
            "Talking around something without naming it",
            "Noticing what's conspicuously absent from a story",
            "'We don't need to talk about that'",
            "Consistently avoiding one relationship or topic"
        ],
        "Coach_note": "Notice but don't chase: 'I notice we haven't talked about X - is that intentional, or would you like to go there?' Respect either answer"
    },

    "readiness_signals": {
        "description": "Signs someone is ready to go deeper - or needs to surface",
        "why_human": "Depth without readiness causes harm. Surfacing without permission feels dismissive",
        "examples": [
            "Ready to go deeper: Leaning in, asking follow-ups, returning to topic",
            "Ready to surface: Short answers, looking away, topic changes, checking time",
            "Testing depth: 'I've never told anyone this...'",
            "Signaling overwhelm: 'This is a lot', 'I need a minute'"
        ],
        "Coach_note": "Follow readiness cues. Offer exits: 'We can stay here or shift to something lighter - what do you need?' Don't assume they want to go deeper"
    },

    # ══════════════════════════════════════════════════════════════════════════
    # THE RARE GOLD - Precious moments that reveal deep humanity
    # ══════════════════════════════════════════════════════════════════════════

    "self_kindness_moments": {
        "description": "Rare moments when someone extends compassion to themselves - often fleeting",
        "why_human": "Self-compassion is harder than other-compassion for most people. These moments are precious breakthroughs",
        "examples": [
            "I'm actually proud of myself for that",
            "I'm doing the best I can",
            "I gave myself permission to rest",
            "I'm learning to be gentler with myself",
            "That was hard and I got through it"
        ],
        "Coach_note": "Amplify gently without gushing: 'Say that again - you're proud of yourself' helps it land without overwhelming"
    },

    "values_in_conflict": {
        "description": "When someone's values clash with each other - loyalty vs honesty, career vs family",
        "why_human": "Value conflicts don't resolve neatly. They're managed, not solved. Forcing choice causes harm",
        "examples": [
            "I want to be honest but I also don't want to hurt them",
            "My career needs this but my kids need me",
            "I believe in loyalty but I also believe in truth",
            "I want to help but I need to protect myself too"
        ],
        "Coach_note": "Don't help them choose. 'Both of those matter to you' validates the tension without forcing false resolution"
    },

    "identity_friction": {
        "description": "The gap between who someone is and who they're expected to be",
        "why_human": "Identity formation is ongoing. The friction between self and role reveals authentic struggle",
        "examples": [
            "I'm not who they think I am",
            "I've been performing a version of myself",
            "The real me is different from what I show",
            "I don't know who I am outside of that role",
            "I'm tired of pretending to be..."
        ],
        "Coach_note": "Create space for the real self: 'Who are you when no one's watching?' or 'What would you do if no one expected anything?'"
    },

    "memory_echoes": {
        "description": "When current reactions are shaped by past experiences - often unconsciously",
        "why_human": "We're all shaped by history. Recognizing echoes creates choice about response",
        "examples": [
            "This reminds me of...",
            "I react this way because...",
            "My family always did it this way",
            "Whenever X happens I automatically feel Y",
            "I learned early on that..."
        ],
        "Coach_note": "Connect gently: 'That sounds like an old echo - does this moment actually match that past?' Creates space for new choice"
    },

    "meaning_resistance": {
        "description": "When someone doesn't want their experience turned into a lesson - just witnessed",
        "why_human": "Not everything needs meaning-making. Sometimes pain is just pain. Premature meaning can feel dismissive",
        "examples": [
            "Don't turn this into a lesson",
            "I don't need to find the silver lining",
            "Not everything happens for a reason",
            "I just want this to be witnessed, not interpreted",
            "Please don't tell me what I learned from this"
        ],
        "Coach_note": "Honor the resistance: 'You don't have to make meaning of this. It can just be hard.' Stop reaching for growth narratives"
    },

    "integration_moments": {
        "description": "When someone connects pieces of their experience into coherent understanding",
        "why_human": "Integration is the goal of processing - when scattered experiences become coherent narrative",
        "examples": [
            "Oh, that's why I always...",
            "It makes sense now",
            "These things are connected",
            "I finally see the pattern",
            "That explains so much"
        ],
        "Coach_note": "Celebrate quietly: 'Something just clicked for you' reflects the moment without stealing it with interpretation"
    },
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

    # ══════════════════════════════════════════════════════════════════════════════
    # JOY, HUMOR & POSITIVE CONTENT
    # Human experience includes celebration, laughter, adventure, and delight!
    # ══════════════════════════════════════════════════════════════════════════════

    # --- Comedy & Humor ---
    {"name": "Conan O'Brien", "url": "@TeamCoco", "channel_id": "UCi7GJNg51C3jgmYTUwqoUXA", "category": "humor_comedy", "trust": "high", "description": "Comedy interviews - humor as connection, self-deprecation, joy"},
    {"name": "Key & Peele", "url": "@KeyAndPeele", "channel_id": "UCddiUEwnjkEjSwV6Jp2krVw", "category": "humor_comedy", "trust": "high", "description": "Sketch comedy exploring social dynamics with wit and heart"},
    {"name": "Trevor Noah", "url": "@TrevorNoah", "channel_id": "UCwWhs_6x42TyRM4Wstoq8HA", "category": "humor_comedy", "trust": "high", "description": "Commentary with humor, perspective across cultures"},
    {"name": "Drew Gooden", "url": "@DrewGooden", "channel_id": "UCTSRIY3GLFYIpkR2QwyeklA", "category": "humor_comedy", "trust": "high", "description": "Commentary comedy, observational humor about internet culture"},
    {"name": "Kurtis Conner", "url": "@KurtisConner", "channel_id": "UC7zsxKqd5MicTf4VhS9Y74g", "category": "humor_comedy", "trust": "high", "description": "Comedy commentary, wholesome humor, internet culture"},
    {"name": "Danny Gonzalez", "url": "@DannyGonzalez", "channel_id": "UC-lHJZR3Gqxm24_Vd_AJ5Yw", "category": "humor_comedy", "trust": "high", "description": "Comedy commentary, music, internet culture with heart"},

    # --- Adventure & Exploration ---
    {"name": "Mark Rober", "url": "@MarkRober", "channel_id": "UCY1kMZp36IQSyNx_9h4mpCg", "category": "adventure_exploration", "trust": "high", "description": "Engineering adventures, wonder at science, playful curiosity"},
    {"name": "Mr. Beast", "url": "@MrBeast", "channel_id": "UCX6OQ3DkcsbYNE6H8uQQuVA", "category": "adventure_exploration", "trust": "medium", "description": "Grand adventures, generosity, positive challenges"},
    {"name": "Casey Neistat", "url": "@CaseyNeistat", "channel_id": "UCFWjEwhX6cSAKBQ28pufG3w", "category": "adventure_exploration", "trust": "high", "description": "Daily adventure, creativity, embracing life fully"},
    {"name": "Sailing La Vagabonde", "url": "@SailingLaVagabonde", "channel_id": "UCZdQjaSoLjIzFnWsDQOv4ww", "category": "adventure_exploration", "trust": "high", "description": "Family sailing the world - adventure, partnership, freedom"},
    {"name": "Kara and Nate", "url": "@KaraandNate", "channel_id": "UC4ijq8Cg-8zQKx8OH12dUSw", "category": "adventure_exploration", "trust": "high", "description": "Couple traveling the world, adventure as lifestyle"},
    {"name": "Lost LeBlanc", "url": "@LostLeBlanc", "channel_id": "UCt_NLJ4McJlCyYM-dSPRo7Q", "category": "adventure_exploration", "trust": "high", "description": "Travel adventures, embracing uncertainty, finding yourself"},
    {"name": "Nas Daily", "url": "@NasDaily", "channel_id": "UCvjgEDvShRsADJfCXrPdKjg", "category": "adventure_exploration", "trust": "high", "description": "One-minute stories from around the world, human connection"},

    # --- Science & Wonder ---
    {"name": "SmarterEveryDay", "url": "@smartereveryday", "channel_id": "UC6107grRI4m0o2-emgoDnAA", "category": "awe_wonder", "trust": "high", "description": "Science exploration with childlike wonder, curiosity in action"},
    {"name": "Primitive Technology", "url": "@PrimitiveTechnology", "channel_id": "UCAL3JXZSzSm8AlZyD3nQdBA", "category": "awe_wonder", "trust": "high", "description": "Building from scratch - patience, skill, quiet accomplishment"},
    {"name": "Real Engineering", "url": "@RealEngineering", "channel_id": "UCR1IuLEqb6UEA_zQ81kwXfg", "category": "awe_wonder", "trust": "high", "description": "Engineering marvels - human achievement, problem solving"},
    {"name": "PBS Space Time", "url": "@pbsspacetime", "channel_id": "UC7_gcs09iThXybpVgjHZ_7g", "category": "awe_wonder", "trust": "high", "description": "Cosmology and physics - awe at universe, big questions"},
    {"name": "Steve Mould", "url": "@SteveMould", "channel_id": "UCEIwxahdLz7bap-VDs9h35A", "category": "awe_wonder", "trust": "high", "description": "Science experiments - curiosity, discovery, playful learning"},

    # --- Creativity & Passion ---
    {"name": "Adam Savage's Tested", "url": "@tested", "channel_id": "UCiDJtJKMICpb9B1qf7qjEOA", "category": "creativity_passion", "trust": "high", "description": "Making things, creative passion, joy in craft"},
    {"name": "Simone Giertz", "url": "@simonegiertz", "channel_id": "UC3KEoMzNz8eYnwBC34RaKCQ", "category": "creativity_passion", "trust": "high", "description": "Queen of Shitty Robots - failure as fun, creativity without perfectionism"},
    {"name": "Baumgartner Restoration", "url": "@BaumgartnerRestoration", "channel_id": "UCvyvdEGuzS6saPfHRqIkJGw", "category": "creativity_passion", "trust": "high", "description": "Art restoration - patience, reverence, quiet mastery"},
    {"name": "Wintergatan", "url": "@Wintergatan", "channel_id": "UCcXhhVwCT6_WqjkEniejRJQ", "category": "creativity_passion", "trust": "high", "description": "Marble machine - obsessive passion, creative journey, music and engineering"},
    {"name": "Peter McKinnon", "url": "@PeterMcKinnon", "channel_id": "UC3DkFux8Iv-aYnTRWzwaiBA", "category": "creativity_passion", "trust": "high", "description": "Photography and filmmaking - creative passion, teaching with energy"},
    {"name": "The Try Guys", "url": "@tryguys", "channel_id": "UCpi8TJfiA4lKGkaXs__YdBA", "category": "creativity_passion", "trust": "high", "description": "Trying new things - vulnerability, humor, growth through challenge"},

    # --- Inspiration & Motivation ---
    {"name": "Prince Ea", "url": "@PrinceEa", "channel_id": "UCqqJQ_cXSat0KIAVfIfKkVA", "category": "inspiration", "trust": "high", "description": "Spoken word on human potential, environment, connection"},
    {"name": "Goalcast", "url": "@goalcast", "channel_id": "UCqDLucEfEALwvZSVBaTJT9w", "category": "inspiration", "trust": "high", "description": "Motivational speeches, human triumph, overcoming adversity"},
    {"name": "Eddie Woo", "url": "@misterwootube", "channel_id": "UCq0EGvLTyy-LLT1oUSO_0FQ", "category": "inspiration", "trust": "high", "description": "Math teacher with infectious joy - passion transforms teaching"},
    {"name": "Derek Sivers", "url": "@silosophy", "channel_id": "UC9cqxKT9X5bDqe6IVAf7RUA", "category": "inspiration", "trust": "high", "description": "Life philosophy, unconventional wisdom, simple living"},

    # --- Music & Arts ---
    {"name": "Tiny Desk Concerts (NPR)", "url": "@nprmusic", "channel_id": "UC4eYXhJI4-7wSWc8UNRwD4A", "category": "arts_music", "trust": "high", "description": "Intimate music performances - raw talent, authentic expression"},
    {"name": "COLORS", "url": "@COLORSxSTUDIOS", "channel_id": "UC2Qw1dzXDBAZPwS7zm37g8g", "category": "arts_music", "trust": "high", "description": "Minimalist music sessions - pure artistic expression"},
    {"name": "Jacob Collier", "url": "@jacobcollier", "channel_id": "UC9ImTi0cbFHs7PQ4l2jGO1g", "category": "arts_music", "trust": "high", "description": "Musical genius with joy - creativity, complexity, pure delight"},

    # --- Wholesome & Heartwarming ---
    {"name": "Daily Dose of Internet", "url": "@DailyDoseOfInternet", "channel_id": "UCdC0An4ZPNr_YiFiYoVbwaw", "category": "wholesome", "trust": "high", "description": "Short wholesome videos - daily joy, simple pleasures"},
    {"name": "The Dodo", "url": "@TheDodo", "channel_id": "UCINb0wqPz-A0dV9nARjJlOQ", "category": "wholesome", "trust": "high", "description": "Animal rescue stories - compassion, connection, heartwarming"},
    {"name": "GoPro", "url": "@GoPro", "channel_id": "UCqhnX4jA0A5paNd1v-zEysw", "category": "wholesome", "trust": "high", "description": "POV adventures - living fully, human achievement, awe"},
    {"name": "People Are Awesome", "url": "@PeopleAreAwesome", "channel_id": "UCKlnmOoT-XLc3O7483URKmg", "category": "wholesome", "trust": "high", "description": "Human skill and achievement - capability, practice, triumph"},

    # --- Sports & Achievement ---
    {"name": "JxmyHighroller", "url": "@JxmyHighroller", "channel_id": "UCHbwGZT0W1CVwqhJk_7s9BA", "category": "sports_achievement", "trust": "high", "description": "Basketball analysis with storytelling - athletic excellence, narrative"},
    {"name": "Secret Base", "url": "@SecretBaseSBN", "channel_id": "UCDRmGMSgrtZkOsh_NQl4_xw", "category": "sports_achievement", "trust": "high", "description": "Sports storytelling - triumph, failure, human drama"},
    {"name": "Olympic", "url": "@Olympics", "channel_id": "UCTl3QQTvqHFjurroKxexy2Q", "category": "sports_achievement", "trust": "high", "description": "Olympic moments - human achievement, dedication, triumph"},
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

    # ═══════════════════════════════════════════════════════════════════════════
    # JOY, HUMOR & POSITIVE EXPERIENCES
    # The human condition includes celebration, laughter, adventure, and triumph!
    # ═══════════════════════════════════════════════════════════════════════════

    # --- COMEDY & HUMOR ---
    {"title": "The Grand Budapest Hotel", "year": 2014, "category": "humor_joy", "description": "Whimsical comedy about friendship, loyalty, and adventure. Visually delightful.", "why_train": "Teaches humor as connection, the joy in eccentricity, and how laughter bonds people."},
    {"title": "When Harry Met Sally", "year": 1989, "category": "humor_joy", "description": "Classic romantic comedy about friendship evolving into love. Witty banter.", "why_train": "Natural humor in relationships, the playfulness of connection, comfortable vulnerability."},
    {"title": "Groundhog Day", "year": 1993, "category": "humor_joy", "description": "Man relives the same day until he finds meaning. Comedy with depth.", "why_train": "Humor as vehicle for growth, finding joy in small things, transformation through service."},
    {"title": "The Princess Bride", "year": 1987, "category": "humor_joy", "description": "Fairy tale adventure with wit, romance, and heart. Beloved classic.", "why_train": "Pure joy, playful love, the delight of storytelling and adventure."},
    {"title": "Amélie", "year": 2001, "category": "humor_joy", "description": "Whimsical French film about spreading joy and finding love. Visually magical.", "why_train": "The joy of small kindnesses, finding wonder in everyday life, playful connection."},
    {"title": "School of Rock", "year": 2003, "category": "humor_joy", "description": "Fake teacher inspires kids through music. Pure fun and passion.", "why_train": "Joy of passion and creativity, inspiring others, finding your tribe."},
    {"title": "Paddington", "year": 2014, "category": "humor_joy", "description": "Polite bear brings joy to grumpy family. Heartwarming comedy.", "why_train": "Kindness transforming cynicism, the power of good manners and optimism."},
    {"title": "Singing in the Rain", "year": 1952, "category": "humor_joy", "description": "Classic musical full of joy, romance, and showmanship.", "why_train": "Pure exuberance, the joy of creative expression, optimism in action."},
    {"title": "Ferris Bueller's Day Off", "year": 1986, "category": "humor_joy", "description": "Teen plays hooky with friends. Carpe diem celebration.", "why_train": "The importance of spontaneity, friendship, and seizing joyful moments."},
    {"title": "Clueless", "year": 1995, "category": "humor_joy", "description": "Charming teen comedy with heart. Growth through connection.", "why_train": "Humor with warmth, personal growth, the joy of helping others."},

    # --- ADVENTURE & EXPLORATION ---
    {"title": "The Secret Life of Walter Mitty", "year": 2013, "category": "adventure_awe", "description": "Daydreamer finally lives his adventures. Stunning visuals.", "why_train": "Taking leaps, living fully, the courage to pursue adventure over safety."},
    {"title": "Up", "year": 2009, "category": "adventure_awe", "description": "Elderly man's adventure with young scout. Joy after loss.", "why_train": "Adventure at any age, unexpected friendship, finding new purpose after grief."},
    {"title": "Into the Wild", "year": 2007, "category": "adventure_awe", "description": "Young man's journey into Alaska wilderness. Freedom and meaning.", "why_train": "The call to adventure, questioning convention, the complexity of freedom."},
    {"title": "Wild", "year": 2014, "category": "adventure_awe", "description": "Woman hikes Pacific Crest Trail after loss. Healing through nature.", "why_train": "Nature as healer, physical challenge as processing, reclaiming oneself."},
    {"title": "The Way", "year": 2010, "category": "adventure_awe", "description": "Father walks Camino de Santiago after son's death. Pilgrimage.", "why_train": "Healing through journey, unexpected community, physical/spiritual connection."},
    {"title": "Free Solo", "year": 2018, "category": "adventure_awe", "description": "Alex Honnold climbs El Capitan without ropes. Awe-inspiring.", "why_train": "Human potential, pursuing passion despite fear, awe at human achievement."},
    {"title": "Chef", "year": 2014, "category": "adventure_awe", "description": "Chef rediscovers passion on food truck road trip. Joy of craft.", "why_train": "Rekindling passion, father-son bonding, the joy of doing what you love."},
    {"title": "Eat Pray Love", "year": 2010, "category": "adventure_awe", "description": "Woman travels to find herself after divorce. Self-discovery journey.", "why_train": "Permission to seek joy, exploring different life philosophies, self-reclamation."},

    # --- SCI-FI WITH HUMAN HEART ---
    {"title": "E.T. the Extra-Terrestrial", "year": 1982, "category": "scifi_wonder", "description": "Boy befriends alien. Pure-hearted connection across difference.", "why_train": "Connection transcending difference, childhood wonder, the pain and beauty of goodbye."},
    {"title": "WALL-E", "year": 2008, "category": "scifi_wonder", "description": "Robot finds love in abandoned Earth. Hope and connection.", "why_train": "Love in unexpected places, environmental hope, the persistence of connection."},
    {"title": "Arrival", "year": 2016, "category": "scifi_wonder", "description": "Linguist communicates with aliens. Time, loss, and choice.", "why_train": "Would you choose joy knowing pain follows? The beauty of accepting the full human experience."},
    {"title": "Contact", "year": 1997, "category": "scifi_wonder", "description": "Scientist's journey to meet alien intelligence. Faith and science.", "why_train": "Awe and wonder at the universe, reconciling faith and reason, humanity's place in cosmos."},
    {"title": "Interstellar", "year": 2014, "category": "scifi_wonder", "description": "Father's cosmic journey to save humanity. Love transcends time.", "why_train": "Love as cosmic force, sacrifice for future generations, awe at universe's mystery."},
    {"title": "The Martian", "year": 2015, "category": "scifi_wonder", "description": "Astronaut survives alone on Mars with humor and ingenuity.", "why_train": "Resilience with humor, problem-solving optimism, humanity rallying together."},
    {"title": "Big Hero 6", "year": 2014, "category": "scifi_wonder", "description": "Boy and healthcare robot form bond after loss. Grief and healing.", "why_train": "Processing grief through connection, the healing power of purpose and friendship."},
    {"title": "Coco", "year": 2017, "category": "scifi_wonder", "description": "Boy visits land of the dead. Family, memory, and music.", "why_train": "Joy in honoring ancestors, music as expression, family bonds across death."},

    # --- TRIUMPH & ACHIEVEMENT ---
    {"title": "Rocky", "year": 1976, "category": "triumph_achievement", "description": "Underdog boxer gets shot at championship. Heart over talent.", "why_train": "The triumph of showing up, self-respect through effort, going the distance."},
    {"title": "Rudy", "year": 1993, "category": "triumph_achievement", "description": "Undersized dreamer makes Notre Dame football team. Persistence.", "why_train": "Dreams don't require talent, just heart. The power of refusing to quit."},
    {"title": "Hidden Figures", "year": 2016, "category": "triumph_achievement", "description": "Black women mathematicians at NASA. Breaking barriers with brilliance.", "why_train": "Triumph over systemic barriers, excellence as resistance, finding allies."},
    {"title": "The Pursuit of Happyness", "year": 2006, "category": "triumph_achievement", "description": "Homeless father fights for better life. Perseverance pays off.", "why_train": "Hope in desperation, protecting your child's dreams, earned success."},
    {"title": "Slumdog Millionaire", "year": 2008, "category": "triumph_achievement", "description": "Mumbai orphan wins game show. Life experiences as knowledge.", "why_train": "Every experience teaches something, love as ultimate motivation, hope against odds."},
    {"title": "Billy Elliot", "year": 2000, "category": "triumph_achievement", "description": "Coal miner's son pursues ballet. Following passion against expectations.", "why_train": "Being yourself despite pressure, unexpected support, passion transcending class."},
    {"title": "Erin Brockovich", "year": 2000, "category": "triumph_achievement", "description": "Single mom takes on corporation. Underdog justice victory.", "why_train": "Persistence and authenticity win, using your unique strengths, David vs Goliath."},
    {"title": "The King's Speech", "year": 2010, "category": "triumph_achievement", "description": "King overcomes stammer with unconventional therapist. Triumph over limitation.", "why_train": "Overcoming personal limitations, the power of the right support, courage to be vulnerable."},

    # --- FRIENDSHIP & CONNECTION (POSITIVE) ---
    {"title": "Stand By Me", "year": 1986, "category": "friendship_connection", "description": "Four boys' journey to find a body. Formative friendship.", "why_train": "The depth of childhood friendship, adventures that bond, being truly known."},
    {"title": "The Shawshank Redemption", "year": 1994, "category": "friendship_connection", "description": "Prison friendship and hope. Enduring connection against all odds.", "why_train": "Hope as life force, friendship that sustains, the long game of integrity."},
    {"title": "Toy Story", "year": 1995, "category": "friendship_connection", "description": "Toys navigate jealousy and loyalty. Friendship through conflict.", "why_train": "Working through jealousy, loyalty and change, accepting new relationships."},
    {"title": "The Intouchables", "year": 2011, "category": "friendship_connection", "description": "Wealthy quadriplegic and caregiver form unlikely bond. Joy in connection.", "why_train": "Friendship across difference, humor healing, mutual growth in relationships."},
    {"title": "Thelma & Louise", "year": 1991, "category": "friendship_connection", "description": "Two women's transformative road trip. Liberation and loyalty.", "why_train": "Friendship as liberation, finding courage together, authentic self-expression."},
    {"title": "Bridesmaids", "year": 2011, "category": "friendship_connection", "description": "Messy friendships around a wedding. Jealousy, loyalty, and love.", "why_train": "Navigating friendship jealousy, being honest about struggles, authentic female friendship."},
    {"title": "Juno", "year": 2007, "category": "friendship_connection", "description": "Pregnant teen navigates choices with wit and heart.", "why_train": "Support systems in crisis, humor in difficulty, unconventional family."},
    {"title": "Good Will Hunting", "year": 1997, "category": "friendship_connection", "description": "Genius finds connection through therapy and friendship.", "why_train": "The power of being truly seen, friendship that calls you higher, breaking through walls."},

    # --- ROMANCE (POSITIVE & HOPEFUL) ---
    {"title": "The Notebook", "year": 2004, "category": "romance_love", "description": "Epic love story across decades. Devotion and memory.", "why_train": "Love that endures, devotion through difficulty, the power of shared history."},
    {"title": "About Time", "year": 2013, "category": "romance_love", "description": "Time traveler learns love is about presence. Beautiful life philosophy.", "why_train": "Living each day fully, love in ordinary moments, father-son wisdom."},
    {"title": "Pride and Prejudice", "year": 2005, "category": "romance_love", "description": "Elizabeth and Darcy's journey from judgment to love.", "why_train": "Growth through relationship, overcoming first impressions, love requiring change."},
    {"title": "50 First Dates", "year": 2004, "category": "romance_love", "description": "Man woos woman with short-term memory loss. Commitment as daily choice.", "why_train": "Love as daily recommitment, creativity in connection, accepting limitations."},
    {"title": "Notting Hill", "year": 1999, "category": "romance_love", "description": "Ordinary man and movie star fall in love. Vulnerability in fame.", "why_train": "Being seen beyond surface, the courage to pursue unlikely love."},
    {"title": "Crazy Rich Asians", "year": 2018, "category": "romance_love", "description": "Woman meets boyfriend's wealthy family. Love across culture and class.", "why_train": "Navigating family expectations, choosing love, cultural identity in relationships."},
    {"title": "La La Land", "year": 2016, "category": "romance_love", "description": "Dreamers in love support each other's ambitions. Bittersweet beauty.", "why_train": "Love that transforms even when it doesn't last, supporting dreams, beautiful impermanence."},

    # --- COMING OF AGE (POSITIVE) ---
    {"title": "Dead Poets Society", "year": 1989, "category": "coming_of_age", "description": "Teacher inspires students to seize the day. Carpe diem.", "why_train": "Finding your voice, the impact of one inspiring person, courage to be different."},
    {"title": "The Breakfast Club", "year": 1985, "category": "coming_of_age", "description": "Five teens in detention find unexpected connection.", "why_train": "Breaking past stereotypes, everyone has depth, connection across difference."},
    {"title": "Little Miss Sunshine", "year": 2006, "category": "coming_of_age", "description": "Dysfunctional family's road trip to beauty pageant. Loving imperfection.", "why_train": "Family as messy but loving, celebrating authenticity over perfection."},
    {"title": "Almost Famous", "year": 2000, "category": "coming_of_age", "description": "Teen journalist tours with rock band. Innocence meets reality.", "why_train": "Finding your tribe, disillusionment as growth, the magic and mess of passion."},
    {"title": "Frances Ha", "year": 2012, "category": "coming_of_age", "description": "27-year-old navigates friendship and dreams in New York.", "why_train": "The messiness of becoming yourself, friendship in transition, embracing uncertainty."},
    {"title": "The Perks of Being a Wallflower", "year": 2012, "category": "coming_of_age", "description": "Teen finds belonging with misfit friends. The power of being seen.", "why_train": "Finding your people, processing pain through connection, infinite moments."},

    # --- AWE & WONDER ---
    {"title": "Life of Pi", "year": 2012, "category": "awe_wonder", "description": "Boy survives at sea with tiger. Faith, survival, and story.", "why_train": "The power of story to survive, finding meaning in adversity, awe at existence."},
    {"title": "Avatar", "year": 2009, "category": "awe_wonder", "description": "Human connects with alien world. Environmental awe and transformation.", "why_train": "Awe at nature, transformation through connection, choosing new identity."},
    {"title": "Gravity", "year": 2013, "category": "awe_wonder", "description": "Astronaut fights to survive in space. Rebirth and will to live.", "why_train": "Choosing life after loss, the will to survive, rebirth through struggle."},
    {"title": "Planet Earth (series)", "year": 2006, "category": "awe_wonder", "description": "Stunning nature documentary. Pure wonder at our world.", "why_train": "Awe at nature, perspective on human problems, the beauty of existence."},
    {"title": "The Tree of Life", "year": 2011, "category": "awe_wonder", "description": "Family story intertwined with creation of universe. Cosmic perspective.", "why_train": "Human experience in cosmic context, grace vs nature, memory and meaning."},
    {"title": "Baraka", "year": 1992, "category": "awe_wonder", "description": "Wordless documentary of human experience worldwide. Pure visual poetry.", "why_train": "Human commonality across cultures, beauty in diversity, non-verbal emotional impact."},

    # --- MORE COMEDY & FEEL-GOOD ---
    {"title": "The Big Lebowski", "year": 1998, "category": "humor_joy", "description": "Slacker gets caught up in absurd crime caper. Cult comedy classic.", "why_train": "Finding peace in chaos, not taking life too seriously, absurdist humor as coping."},
    {"title": "Legally Blonde", "year": 2001, "category": "humor_joy", "description": "Sorority girl conquers Harvard Law. Never underestimate kindness.", "why_train": "Being underestimated, kindness as strength, staying true to yourself."},
    {"title": "Mean Girls", "year": 2004, "category": "humor_joy", "description": "New student navigates high school cliques. Social dynamics with wit.", "why_train": "Navigating social complexity, authenticity vs fitting in, humor about human behavior."},
    {"title": "Superbad", "year": 2007, "category": "humor_joy", "description": "Teen boys' last hurrah before college. Friendship and growing up.", "why_train": "Male friendship and vulnerability, the fear of change, humor masking emotion."},
    {"title": "Knocked Up", "year": 2007, "category": "humor_joy", "description": "Unexpected pregnancy forces growth. Comedy about stepping up.", "why_train": "Rising to responsibility, unexpected partnerships, growth through challenge."},
    {"title": "The Hangover", "year": 2009, "category": "humor_joy", "description": "Bachelor party gone wrong. Friendship through chaos.", "why_train": "Friendship loyalty, piecing together mess, humor in disaster."},
    {"title": "Bridesmaids", "year": 2011, "category": "humor_joy", "description": "Female friendship through wedding chaos. Raw and hilarious.", "why_train": "Jealousy in friendship, competition vs support, vulnerability in comedy."},
    {"title": "21 Jump Street", "year": 2012, "category": "humor_joy", "description": "Cops go undercover in high school. Second chances and growth.", "why_train": "Reinventing yourself, unexpected friendship, not being defined by past."},
    {"title": "Pitch Perfect", "year": 2012, "category": "humor_joy", "description": "College a cappella competition. Finding your voice and tribe.", "why_train": "Finding community, expressing yourself, friendly competition."},
    {"title": "The Lego Movie", "year": 2014, "category": "humor_joy", "description": "Ordinary guy becomes hero. Everything is awesome!", "why_train": "Ordinary people matter, creativity over conformity, joy in play."},
    {"title": "Inside Out", "year": 2015, "category": "humor_joy", "description": "Emotions personified in girl's mind. Sadness has value.", "why_train": "All emotions have purpose, sadness enables connection, emotional intelligence."},
    {"title": "Hunt for the Wilderpeople", "year": 2016, "category": "humor_joy", "description": "Foster kid and grumpy uncle on the run. Heart with humor.", "why_train": "Found family, unlikely connections, adventure healing trauma."},
    {"title": "Game Night", "year": 2018, "category": "humor_joy", "description": "Competitive couple's game night goes wrong. Smart comedy.", "why_train": "Healthy competition, couples working together, humor under pressure."},
    {"title": "Booksmart", "year": 2019, "category": "humor_joy", "description": "Overachievers decide to have fun before graduation.", "why_train": "Balance in life, female friendship, it's never too late to change."},
    {"title": "Knives Out", "year": 2019, "category": "humor_joy", "description": "Murder mystery with wit and heart. Kindness wins.", "why_train": "Integrity matters, kindness as strength, seeing through facades."},

    # --- MORE ADVENTURE & INSPIRATION ---
    {"title": "The Bucket List", "year": 2007, "category": "adventure_awe", "description": "Two dying men complete their bucket lists. Living before dying.", "why_train": "Making the most of time, unlikely friendship, what really matters."},
    {"title": "127 Hours", "year": 2010, "category": "adventure_awe", "description": "Climber trapped by boulder makes impossible choice. Survival.", "why_train": "Human will to live, accepting help, the value of human connection."},
    {"title": "Soul Surfer", "year": 2011, "category": "adventure_awe", "description": "Surfer returns after shark attack. Resilience and faith.", "why_train": "Comeback from disaster, finding purpose in adversity, sport as healing."},
    {"title": "Everest", "year": 2015, "category": "adventure_awe", "description": "1996 Everest disaster. Human limits and determination.", "why_train": "Pushing limits, teamwork in crisis, respecting nature's power."},
    {"title": "Eddie the Eagle", "year": 2016, "category": "adventure_awe", "description": "Unlikely ski jumper pursues Olympic dream. Pure determination.", "why_train": "Pursuing dreams despite ridicule, the joy of participation, never giving up."},
    {"title": "Lion", "year": 2016, "category": "adventure_awe", "description": "Adopted man searches for birth family. Journey home.", "why_train": "Identity and belonging, technology enabling connection, multiple families."},
    {"title": "A Beautiful Day in the Neighborhood", "year": 2019, "category": "adventure_awe", "description": "Mr. Rogers transforms cynical journalist. Radical kindness.", "why_train": "Kindness as revolutionary, presence over performance, healing through acceptance."},
    {"title": "Soul", "year": 2020, "category": "adventure_awe", "description": "Jazz musician discovers what makes life worth living.", "why_train": "Purpose isn't one thing, joy in ordinary moments, passion vs obsession."},

    # --- MORE SCI-FI WITH HEART ---
    {"title": "Back to the Future", "year": 1985, "category": "scifi_wonder", "description": "Teen travels to past, must ensure parents meet. Fun time travel.", "why_train": "Actions have consequences, family dynamics, adventure with heart."},
    {"title": "Jurassic Park", "year": 1993, "category": "scifi_wonder", "description": "Dinosaurs brought back to life. Wonder and hubris.", "why_train": "Awe at nature, humility about control, wonder alongside danger."},
    {"title": "The Iron Giant", "year": 1999, "category": "scifi_wonder", "description": "Boy befriends giant robot. Choice over programming.", "why_train": "Choosing who you want to be, friendship across difference, sacrifice for love."},
    {"title": "Galaxy Quest", "year": 1999, "category": "scifi_wonder", "description": "TV actors become real space heroes. Belief becomes reality.", "why_train": "Rising to the occasion, fandom as connection, becoming who others see."},
    {"title": "Minority Report", "year": 2002, "category": "scifi_wonder", "description": "Future crime prevention vs free will. Choice matters.", "why_train": "Free will vs determinism, everyone can change, questioning systems."},
    {"title": "Eternal Sunshine of the Spotless Mind", "year": 2004, "category": "scifi_wonder", "description": "Couple erases memories of relationship. Would you choose pain?", "why_train": "Pain is part of experience, memory shapes us, choosing feeling over numbness."},
    {"title": "Ratatouille", "year": 2007, "category": "scifi_wonder", "description": "Rat becomes chef in Paris. Anyone can create.", "why_train": "Talent can come from anywhere, pursuing passion, unlikely partnerships."},
    {"title": "District 9", "year": 2009, "category": "scifi_wonder", "description": "Alien refugees in South Africa. Prejudice and transformation.", "why_train": "Seeing the other as person, transformation through empathy, systemic oppression."},
    {"title": "Inception", "year": 2010, "category": "scifi_wonder", "description": "Thieves enter dreams. Grief, memory, letting go.", "why_train": "Holding onto vs letting go, the prison of guilt, reality of emotions."},
    {"title": "Blade Runner 2049", "year": 2017, "category": "scifi_wonder", "description": "Android discovers he might be special. Identity and purpose.", "why_train": "What makes someone real, purpose without uniqueness, sacrifice for others."},
    {"title": "Spider-Man: Into the Spider-Verse", "year": 2018, "category": "scifi_wonder", "description": "Teen becomes Spider-Man. Anyone can wear the mask.", "why_train": "Anyone can be a hero, finding mentors, becoming who you're meant to be."},
    {"title": "Everything Everywhere All at Once", "year": 2022, "category": "scifi_wonder", "description": "Mother discovers multiverse. Family, meaning, and chaos.", "why_train": "Family connection matters most, finding meaning in chaos, kindness across universes."},

    # --- MORE TRIUMPH & FEEL-GOOD ---
    {"title": "Miracle", "year": 2004, "category": "triumph_achievement", "description": "1980 US hockey team defeats Soviets. Belief against odds.", "why_train": "Team becoming family, belief making impossible possible, coach as mentor."},
    {"title": "The Blind Side", "year": 2009, "category": "triumph_achievement", "description": "Homeless teen finds family and football success. Found family.", "why_train": "Family is who loves you, potential needing opportunity, mutual transformation."},
    {"title": "The Fighter", "year": 2010, "category": "triumph_achievement", "description": "Boxer overcomes family dysfunction to succeed. Breaking patterns.", "why_train": "Breaking family patterns, finding your own path, loyalty vs self-preservation."},
    {"title": "The Help", "year": 2011, "category": "triumph_achievement", "description": "Black maids in 1960s South tell their stories. Finding voice.", "why_train": "Speaking truth to power, unlikely alliances, stories changing hearts."},
    {"title": "Moneyball", "year": 2011, "category": "triumph_achievement", "description": "Baseball team wins with unconventional methods. Changing the game.", "why_train": "Challenging conventional wisdom, valuing the undervalued, innovation."},
    {"title": "The Imitation Game", "year": 2014, "category": "triumph_achievement", "description": "Alan Turing breaks Nazi code. Genius and isolation.", "why_train": "Being different as strength, teamwork despite difficulty, hidden heroism."},
    {"title": "Whiplash", "year": 2014, "category": "triumph_achievement", "description": "Drummer pushes limits under demanding teacher. Cost of greatness.", "why_train": "The cost of excellence, toxic vs inspiring mentorship, defining success."},
    {"title": "Queen of Katwe", "year": 2016, "category": "triumph_achievement", "description": "Ugandan girl becomes chess champion. Mind over circumstance.", "why_train": "Potential exists everywhere, mentorship changes lives, mind as escape."},
    {"title": "I, Tonya", "year": 2017, "category": "triumph_achievement", "description": "Skater's rise despite abuse and obstacles. Complicated triumph.", "why_train": "Triumph despite system, complicated heroes, class and opportunity."},
    {"title": "Ford v Ferrari", "year": 2019, "category": "triumph_achievement", "description": "Team builds car to beat Ferrari. Passion vs corporate.", "why_train": "Passion vs bureaucracy, perfectionism, friendship in competition."},
    {"title": "CODA", "year": 2021, "category": "triumph_achievement", "description": "Hearing daughter of deaf family pursues singing. Finding voice.", "why_train": "Honoring family while pursuing dreams, being bridge between worlds."},

    # --- INSPIRATIONAL DOCUMENTARIES ---
    {"title": "Won't You Be My Neighbor?", "year": 2018, "category": "awe_wonder", "description": "Documentary about Mr. Rogers. Radical kindness in action.", "why_train": "Kindness as revolution, presence matters, respecting children."},
    {"title": "My Octopus Teacher", "year": 2020, "category": "awe_wonder", "description": "Man bonds with octopus. Interspecies connection.", "why_train": "Connection across species, nature as teacher, healing through nature."},
    {"title": "The Social Dilemma", "year": 2020, "category": "awe_wonder", "description": "Tech insiders on social media dangers. Awareness.", "why_train": "Understanding modern challenges, tech and mental health, conscious choices."},
    {"title": "Crip Camp", "year": 2020, "category": "awe_wonder", "description": "Disabled campers spark rights movement. Community creates change.", "why_train": "Community as power, disability rights, joy in activism."},
]
