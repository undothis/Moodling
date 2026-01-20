Requirements for AI Memory, Referencing, and Insights

1. Referencing Quick Logs & Services
    •    The AI must be able to reference all user data, including:
    •    Quick Logs
    •    Journal entries
    •    Exercises
    •    Services used
    •    Any repeated interactions (e.g. clicking the same exercise multiple times)
    •    If the data does not exist or is incomplete, the AI should say so explicitly.
    •    Example failure:
    •    User asks: “How many times did I exercise today? Can you see my quick logs?”
    •    Incorrect response: “I see you have a 1-day exercise streak” (this does not answer the question).
    •    Correct behavior:
    •    Clearly state:
    •    Number of logged exercises or
    •    That exercise count cannot be determined from available Quick Logs.

2. Long-Term Memory & Historical Reasoning
    •    The AI needs to simulate and reason over years of user data, not just recent entries.
    •    It should be able to:
    •    Reference events across long timelines
    •    Track patterns across months and years
    •    Cross-reference different data sources (logs, journals, life events, changes)

Examples:
    •    “What has made me feel most anxious over the last 2 years?”
    •    “What life changes correlate with increased anxiety?”
    •    “Compare my anxiety before and after X change.”

3. Correlations & Pattern Detection
    •    The AI should be able to:
    •    Detect correlations between:
    •    Mood
    •    Anxiety
    •    Habits
    •    Life changes
    •    External events
    •    Explain correlations clearly and cautiously (no overconfidence).

4. Context-Aware Recommendations
    •    The AI should be able to use stored preferences and context to:
    •    Recommend restaurants based on:
    •    Eating preferences
    •    Location
    •    Travel (including other countries)
    •    Pull from all relevant stored information automatically.

5. Data Architecture Change
    •    Quick Logs should be removed from “Insights.”
    •    Quick Logs are now considered “Twigs” (raw, atomic data).
    •    Insights should be derived, not raw.

6. Journal Insights – Mental Health–Safe Design
    •    Journal insights must be more positive and supportive.
    •    Avoid negative emotional reinforcement:
    •    Emojis (sad faces, etc.) should not be used in charts or summaries.
    •    A depressed user seeing only sad indicators is harmful.
    •    Charts and summaries should:
    •    Focus on wins, resilience, and progress
    •    Highlight positive moments, even if small
    •    Avoid emphasizing losses or failures

7. Insight Framing Rules
    •    Insights should answer:
    •    “What is working?”
    •    “What helped even slightly?”
    •    “What patterns suggest resilience?”
    •    Losses or negative trends can exist, but should never dominate the presentation.

⸻

Summary (for the AI)
    •    Be precise.
    •    Reference actual data, not placeholders.
    •    Admit when data is missing.
    •    Reason across long timelines.
    •    Detect patterns responsibly.
    •    Design insights to support vulnerable users, not reinforce despair.
