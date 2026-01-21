# Mood Leaf Project Handoff

**Date:** January 21, 2026
**Branch:** `claude/resume-after-corruption-USBHf`

---

## 1. PROJECT INTENT (WHY THIS EXISTS)

Mood Leaf is a mental health journaling app that uses AI to provide personalized, empathetic coaching while helping users track patterns in their emotions, habits, and life events. Success means users feel genuinely heard and understood—not like they're talking to a generic chatbot. The AI must always reference specific user data (journals, twigs, life context) to demonstrate active listening. Safety is paramount: no diagnoses, no sad emojis, no negative framing, and crisis detection with appropriate resources.

---

## 2. CURRENT STATE (WHERE WE ARE)

**Overall Status:** Implementation / Refinement

The core app is functional with:
- Journaling with sentiment analysis
- Quick logs ("Twigs") for habit tracking
- AI coaching with multiple personas (Clover, Spark, Willow, Luna, Ridge, Flint, Fern)
- Life context compression for long-term memory
- Psychological profile building
- Simulator Mode for AI verification testing

Currently refining the Simulator Mode to properly validate AI behavior.

---

## 3. WHAT IS WORKING (SUCCESS)

- **AI Coach System:** Multiple personas working with adaptive mode, chronotype awareness, and travel/jet lag support
- **Data Pipeline:** Journals, twigs, life context, psych profile, health data all flow to Claude's system prompt
- **Simulator Mode Toggle:** Persists correctly across navigation
- **Challenge Generator:** Creates prompts to test AI data referencing
- **Challenge Persistence:** Challenge state now saves when navigating away
- **Verification System:** Checks AI responses against actual user data (journals, life context, psych profile)
- **Mental Health Safety:** No sad emojis, positive framing, crisis detection
- **Explicit Data Referencing Instructions:** Added to AI coach prompt to ensure specific, not generic responses
- **Exact Twig Timestamps:** AI now receives exact times for today's/yesterday's twig entries (e.g., "5:11 PM")

---

## 4. WHAT IS NOT WORKING / OPEN ISSUES (FAILURES)

- **Strange characters in chat responses:** User reported odd characters at start of some responses (e.g., "\nd I'm so sorry"). May be clipboard/encoding issue or API response artifact. Needs investigation.
- **`[H]` placeholder appeared in chat:** Claude was inserting `[H]` as a name placeholder. FIXED - added explicit instructions to never use bracket placeholders.
- **Verification edge cases:** The generic detection (CHECK 7) was flagging responses as generic even when actual data references were found. FIXED but may need more tuning.
- **Twig time tracking:** AI couldn't answer "what did I log at 5:11 PM?" FIXED - now includes exact timestamps for today's and yesterday's entries.

---

## 5. KEY ASSUMPTIONS (CALL THESE OUT)

- **User has data:** Simulator verification assumes user has journals, twigs, and life context stored. Empty data states may behave differently. (UNTESTED)
- **Claude follows instructions:** Assumes Claude will reliably follow the "CRITICAL - ALWAYS REFERENCE SPECIFIC DATA" instructions in system prompt
- **AsyncStorage reliability:** Assumes AsyncStorage works consistently across web and native platforms
- **Keyword matching accuracy:** Life context keyword extraction assumes significant words are >4 characters

---

## 6. CONSTRAINTS & NON-NEGOTIABLES

- **No diagnoses:** Never say "you have anxiety disorder" or similar clinical labels
- **No sad emojis:** Mental health safety - avoid reinforcing negative states
- **Wins-first framing:** Always lead with positives, never shame or criticize
- **No placeholder names:** Never use `[Name]`, `[H]`, `[User]` or any bracket notation
- **Crisis handling:** Immediate resources for suicidal/self-harm language (988, Crisis Text Line)
- **Privacy:** Derived insights only, no raw journal text exposed unnecessarily
- **User autonomy:** Encourage real-world connection, not AI dependency

---

## 7. DECISIONS MADE (DO NOT RE-LITIGATE WITHOUT CAUSE)

- **Haiku model for development:** Cost-effective testing, Sonnet for production
- **Nature-themed personas:** 7 distinct personalities users can choose or adapt
- **AsyncStorage for persistence:** Simple, cross-platform storage
- **Simulator Mode as verification tool:** Not user-facing feature, developer/testing tool
- **CHECK 7 logic:** Only flags generic if no actual data references found AND uses generic phrases
- **Challenge state persistence:** Saves to AsyncStorage with dedicated keys

---

## 8. NEXT STEPS (FOR NEXT SESSION)

1. **Test AI response quality:** Run multiple challenges and verify AI consistently references specific user data
2. **Investigate strange characters:** Check if issue persists after [H] fix, may need to examine API response handling
3. **Add user name support (optional):** Consider adding optional user name field so AI can address them personally
4. **Edge case testing:** Test Simulator Mode with empty data (no journals, no twigs, no life context)
5. **Verify challenge categories:** Test each challenge category (data_accuracy, cross_domain, long_term_correlation, mental_health_framing)
6. **Consider debouncing:** AI response persistence saves on every keystroke - may want to add debounce for performance

---

## 9. HANDOFF NOTES (CONTEXT FOR THE NEXT MIND)

- **Branch has been merged:** Combined `claude/review-mega-prompt-LmMqp` (had this template) with `claude/resume-after-corruption-USBHf` (had all simulator fixes). Kept simulator fixes, added template.
- **Key files modified today:**
  - `moodling-app/app/simulator.tsx` - Challenge persistence, CHECK 7 fix, AI response handler
  - `moodling-app/services/claudeAPIService.ts` - Added "ADDRESSING THE USER" section to prevent [H] placeholders
- **User cares deeply about:** AI feeling personal, not generic. Every response should demonstrate the AI "remembers" their specific situation.
- **Don't repeat:** The generic check issue where it flagged as generic even with data refs found
- **Testing flow:** Simulator > Generate Challenge > Copy to Chat > Paste AI response back > Verify

---

## 10. SUCCESS CRITERIA FOR THE NEXT CHECKPOINT

- [ ] AI responses consistently reference specific user data (journals, life context, people, events)
- [ ] No more `[H]` or bracket placeholders appearing in chat
- [ ] Challenge state reliably persists across navigation
- [ ] Verification results are accurate (no contradictory positives + generic flags)
- [ ] All challenge categories produce meaningful tests

---

## QUICK STATUS SNAPSHOT

"Simulator Mode verification is functional with challenge persistence; next session should focus on testing AI response quality to ensure specific data referencing works consistently."
