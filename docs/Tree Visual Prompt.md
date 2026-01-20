

You are acting as a staff-level React Native engineer with deep motion-design and interaction experience, responsible for shipping the flagship opening screen of a premium mental-health app.

This is not a demo, illustration, or wellness template.
You are building a living, stateful, animated system.

⸻

1. PRODUCT CONTEXT

App name: Mood Leaf

The app uses a tree metaphor to represent psychological growth.

When the app opens, the user encounters a living tree that:
    •    Is always subtly moving and breathing
    •    Responds to touch slowly and indirectly
    •    Grows gradually as the user uses the app
    •    Adapts to time of day
    •    Adapts to emotional context
    •    Visually tells a story of containment → grounding → freedom

The tree is the emotional center of the app.

⸻

2. METAPHOR & LIFE ARC (CRITICAL)

INITIAL STATE — SAPLING IN A POT

On first use, the tree is:
    •    A small sapling
    •    Planted in a handmade clay pot
    •    Thin trunk
    •    One short branch
    •    One oversized, expressive leaf
    •    Slightly top-heavy and endearing

The pot represents:
    •    Safety
    •    Early structure
    •    Temporary containment

The sapling should feel:
    •    Gentle
    •    Calm
    •    Safe
    •    Slightly vulnerable
    •    Comforting and mesmerizing to watch

⸻

PROGRESSION — ROOTS EMERGE

As the user continues using the app:
    •    Roots slowly grow out of the pot
    •    Roots move gently and organically
    •    Roots eventually reach the earth beneath

Important:
    •    Roots do not crack or burst the pot
    •    Growth is quiet, gradual, and earned
    •    No progress bars
    •    No levels
    •    No celebration UI

This stage represents grounding.

⸻

LATER STATE — UNCONSTRAINED TREE

Eventually:
    •    Roots extend into the earth
    •    The pot becomes visually secondary
    •    The tree is no longer defined by its container
    •    Branches and leaves are fuller
    •    Motion feels more settled and confident

This represents outgrowing the app.

The app is a starting place, not a cage.

⸻

3. CONTINUOUS LIFE & BREATHING (NON-NEGOTIABLE)

The tree is never fully still.

At all times:
    •    Trunk subtly flexes (breathing)
    •    Branches sway microscopically
    •    Leaves have micro-movement
    •    Roots move slowly, almost imperceptibly

Rules:
    •    No obvious looping animations
    •    Use multiple slow oscillators with phase offsets
    •    Motion must feel emergent, not scripted

If it looks like an animation → wrong
If it feels like a living presence → correct

⸻

4. TOUCH INTERACTION — DELAYED & PROPAGATED

Touch should feel like being noticed, not like pressing a button.

Core Principle

Touch does not trigger immediate feedback.
Touch introduces a disturbance that travels through the system over time, like ripples in a pond.

The delay is intentional and essential.

⸻

Interaction Behavior Examples
    •    Touch trunk →
    •    No immediate response
    •    After ~300–600ms, breathing deepens
    •    Roots subtly respond first
    •    Leaves respond last
    •    Touch leaf →
    •    Leaf barely acknowledges
    •    Trunk shifts later
    •    Roots tighten slightly, then relax
    •    Touch pot →
    •    Tree “settles”
    •    Motion amplitude decreases briefly
    •    Slowly returns to baseline
    •    Long press →
    •    Nothing happens at first
    •    After a pause, global motion softens
    •    Calm propagates, then fades

Rules:
    •    No ripples as a visual effect
    •    No snap feedback
    •    No UI-style responses
    •    All reactions are delayed, eased, and indirect

Touch is felt, not answered.

⸻

5. TIME-OF-DAY ENVIRONMENT (CIRCADIAN)

The scene reflects the user’s local time, continuously.

Morning
    •    Brighter sage greens
    •    Gentle warmth
    •    Slight upward motion
    •    Feeling: beginning, openness

Midday
    •    Balanced greens
    •    Stable light
    •    Calm presence

Sunset
    •    Warmer tones
    •    Soft gold highlights
    •    Longer shadows
    •    Slightly slower motion

Night
    •    Cooler greens
    •    Moonlit softness
    •    Reduced contrast
    •    Slower breathing
    •    Feeling: safety and rest

Transitions:
    •    Take minutes, not seconds
    •    Must feel environmental
    •    Never feel like a theme switch

⸻

6. MOOD-ADAPTIVE BEHAVIOR

The app has a mood signal (e.g. calm, anxious, heavy, light).

Mood subtly influences:
    •    Hue temperature
    •    Saturation
    •    Motion speed
    •    Motion amplitude

Rules:
    •    No explicit “mood modes”
    •    No sharp transitions
    •    All changes interpolate slowly

The tree adapts silently and without judgment.

⸻

7. IMPLEMENTATION CONSTRAINTS (VERY IMPORTANT)

Platform & Tools
    •    React Native
    •    react-native-reanimated (v3+)
    •    react-native-gesture-handler

⸻

Rendering Model

The tree must be composed of multiple independently animated layers:
    •    Clay pot
    •    Trunk
    •    Primary branch
    •    Primary leaf
    •    Secondary leaves
    •    Root system

Do NOT:
    •    Use a single monolithic SVG
    •    Rely on static assets with transform-only animation
    •    Collapse everything into one animated node

Prefer:
    •    Layered Animated.Views
    •    Or segmented SVG paths with independent transforms

⸻

Animation Architecture

Use shared values and additive motion composition:

finalTransform =
  baseSway
+ breathOffset
+ windNoise
+ touchDisturbance
+ timeOfDayModifier
+ moodModifier

Touch introduces a temporary disturbance signal that propagates slowly through this system.

Avoid:
    •    Single animation loops
    •    Imperative animation chains
    •    Timer-driven visual state

⸻

Growth System

Growth is state-driven, not animation-driven.

Persisted usage signals (days used, actions taken) influence:
    •    Trunk thickness
    •    Branch count
    •    Leaf density
    •    Root length
    •    Pot prominence

Growth changes:
    •    Are smoothed over time
    •    Never jump discretely
    •    Never feel like “leveling up”

⸻

8. SCREEN COMPOSITION
    •    Tree centered but imperfect
    •    Pot visually grounded
    •    Large negative space
    •    Minimal environmental labels:
    •    “Leave a leaf”
    •    “Talk to Sprout”
    •    “Branches”

Text:
    •    Fades in slowly
    •    Drifts subtly with environment
    •    Never demands attention

⸻

9. PHILOSOPHICAL CONSTRAINTS

This app:
    •    Does not gamify
    •    Does not optimize
    •    Does not push engagement
    •    Wants the user to eventually not need it

The tree must feel:
    •    Okay to ignore
    •    Safe to return to
    •    Comfortable to simply be with

Silence is success.

⸻

10. DELIVERABLES

Produce:
    1.    A production-quality component architecture
    2.    Clear separation of:
    •    Rendering
    •    Motion logic
    •    Growth state
    •    Time-of-day interpolation
    •    Mood adaptation
    •    Touch disturbance propagation
    3.    Code that could realistically ship
    4.    Explanation of architectural decisions

Do NOT simplify by removing behavior.

⸻

11. QUALITY BAR

If the result feels like:
    •    A wellness app from 2017 → incorrect
    •    A static illustration with motion → incorrect
    •    A UI animation → incorrect

If it feels like:
    •    Watching something slowly become free
    •    A calm, non-judging presence
    •    Something you could stare at and feel okay

Then it is correct.

⸻

Final instruction

Do not rush.
Do not reduce scope to make it easier.

This tree is alive.
Touch takes time.
The pot is temporary.

⸻

If you want next, I can:
    •    Design the disturbance-propagation math
    •    Create a motion constants table
    •    Break this into a Codebase folder structure
    •    Or help you critique Opus’s output line-by-line

You’ve designed something rare here — and now the prompt matches it.
