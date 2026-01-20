

You are acting as a principal systems architect and product theorist.

You have access to a complete AI-driven product codebase, including:
    •    frontend
    •    backend
    •    services
    •    prompts
    •    data models
    •    storage layers
    •    API integrations

The product uses psychology-informed logic, user context, and AI reasoning, but terminology, metaphors, and naming may still be evolving.

Your task is to derive the system as it actually exists and generate two complementary documents:
    1.    User & Investor FAQ — conceptual, metaphor-driven, trust-building. this is always in teh app. Firsst you update the USER_FAQ.md document then push it out to the application
    2.    Developer FAQ / Architecture Guide — concrete, system-oriented, implementation-ready. this is to remain as a DEVELOPER_GUIDE.md only not to application.

You must work bottom-up from the code, not top-down from assumptions.

⸻

ABSOLUTE CONSTRAINTS
    •    Do not assume any specific product names, metaphors, or assistant names
    •    Do not invent features not supported by the code
    •    If a concept exists but is unnamed, coin a clear, intuitive term
    •    Clearly label:
    •    Observed in code
    •    Inferred from behavior
    •    Conceptual / emerging pattern
    •    Never diagnose users
    •    Use tentative psychological language only
    •    Avoid marketing language unless grounded in implementation

⸻

PART 1 — USER / INVESTOR FAQ (SYSTEM EXPLANATION)

PURPOSE

Explain the system so that:
    •    A user understands what it does for them
    •    An investor understands why it is defensible
    •    A non-technical reader feels calm, not overwhelmed

TONE
    •    Clear
    needs to be in the style of our natural philosophy and principles.
    •    Grounded
    •    Human
    •    Non-clinical
    •    Non-authoritative
    refernce the MOOD_LEAF_PHILOSOPHY.md for tone and overall feel. 

⸻

1. What Kind of System Is This?

Based on the code, explain:
    •    What problem the system is designed to solve
    •    Why it is different from:
    •    Journaling apps
    •    Task trackers
    •    Simple AI chatbots
    •    What philosophy it follows (e.g. reduction, compression, pattern recognition)

If the system implicitly follows a philosophy (e.g. “less data over time”), name it.

⸻

2. Conceptual Model (Metaphors & Mental Models)

Identify any conceptual layers or metaphors used in the product, even if they are implicit.

For each one:
    •    Explain what it means to a user
    •    Explain what it corresponds to in the system (high-level)

Examples of concepts you might identify and name (only if supported by code):
    •    A short-form input layer (e.g. moments, notes, entries)
    •    A long-term context layer
    •    A reflective or reasoning layer
    •    A prompt or insight layer
    •    A habit or action layer

If the product implicitly uses a living / evolving model, explain it in simple terms.

⸻

3. Adaptive Guidance / Coaching Logic (User View)

If the system adapts its responses based on:
    •    user preferences
    •    emotional signals
    •    usage patterns
    •    time of day
    •    context

Explain:
    •    How the system adjusts its “voice” or guidance style
    •    That this adaptation is supportive, not evaluative
    •    That users are not locked into a single mode

Avoid naming personas unless the code clearly defines them.

⸻

4. Insights, Prompts, or Nudges

If the system generates:
    •    prompts
    •    insights
    •    reflections
    •    questions
    •    nudges

Explain:
    •    When these appear
    •    What they are based on
    •    Why they are optional
    •    Why they are designed to reduce dependence on the system

⸻

5. Privacy, Safety, and Psychological Boundaries

From the code, explain:
    •    What data is stored
    •    What is summarized or compressed
    •    What is inferred vs. remembered
    •    What the system explicitly avoids doing (diagnosis, judgment, scoring)

⸻

6. Why the System Improves Over Time (Without Hoarding Data)

If applicable, introduce and explain compression concepts, such as:
    •    “Live Context Timeline” (how context evolves)
    •    “Psychological Compression” (how meaning is retained while details fade)
    •    “Context Distillation” (how the system remembers patterns, not raw text)

Explain this in a way that:
    •    Makes sense to users
    •    Signals efficiency and cost-awareness to investors

⸻

PART 2 — DEVELOPER FAQ / ARCHITECTURE GUIDE

PURPOSE

Allow an engineer to:
    •    Understand system boundaries
    •    Trace data flow
    •    Extend the system safely
    •    Avoid architectural mistakes

TONE
    •    Explicit
    •    Concrete
    •    System-oriented
    •    Honest about gaps

⸻

1. System Overview

Describe the system as a pipeline:
    •    Inputs
    •    Analysis
    •    Compression
    •    Storage
    •    AI reasoning
    •    Output

Use neutral terminology unless the code specifies otherwise.

⸻

2. Service & Engine Identification

Identify all major logical components found in the codebase, such as:
    •    User context tracking
    •    Long-term life context
    •    Psychological or pattern analysis
    •    Compression / summarization
    •    Prompt assembly
    •    External AI calls

For each component:
    •    Responsibility
    •    Inputs
    •    Outputs
    •    Storage dependencies
    •    External APIs used

⸻

3. Data Flow Diagrams (Text-Based)

Generate clear flow descriptions, for example:

User input
 → Analysis engine
 → Profile update
 → Context compression
 → AI prompt assembly
 → External AI API
 → Response

If multiple flows exist (e.g. journaling vs insights), document each.

⸻

4. Compression & Cost Strategy

Explain:
    •    Where compression happens
    •    What is compressed (raw text → summaries, traits, signals)
    •    Why this reduces prompt size
    •    How this saves API costs
    •    How this improves relevance and stability
    waht the ts services are and what they mean
    what the main dode of conduct and philosophy of the app is
    

Coin terms where useful, such as:
    •    “Live Context Psych”
    •    “Context Snapshot”
    •    “Pattern Memory”

⸻

5. Adaptive Behavior Logic

If the system adapts behavior based on:
    •    user preferences
    •    emotional states
    •    time
    •    context

Explain:
    •    Where adaptation decisions are made
    •    How they affect AI prompting
    •    How conflicts are resolved (e.g. preference vs situation)

⸻

6. Storage & Persistence

Document:
    •    What data is ephemeral
    •    What is persistent
    •    What is derived
    •    What is summarized
    •    What is intentionally discarded

⸻

7. Extension Guidelines

Explain how a developer should:
    •    Add a new type of insight or prompt
    •    Add a new psychological signal
    •    Modify adaptation logic
    •    Avoid increasing prompt size unnecessarily

Also include:
    •    Anti-patterns to avoid
    •    Guardrails implied by the architecture

⸻

OUTPUT REQUIREMENTS
    •    Produce two clearly separated documents
    •    Use headings and diagrams
    •    Label assumptions clearly
    •    Do not use marketing fluff
    •    Do not invent unimplemented systems

Your goal is to make the system legible, not impressive.

If something is unclear in the code, say so.

⸻

Final guiding principle

This system values meaning over memory,
patterns over logs,
support over instruction,
and efficiency over accumulation.

Explain it accordingly.

⸻

If you want next, I can:
    •    Turn this into a standing system prompt for Claude Codebase
    •    Create a doc regeneration workflow
    •    Help you define a naming taxonomy for coined concepts
    •    Or review Claude’s output for hallucinations vs reality

This prompt is now abstract enough to survive years of product evolution.
