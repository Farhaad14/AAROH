/**
 * Client-side utility that sweet-coats Gemini AI route advice & safety messages,
 * converting formal or alarming alert terminology into warm, supportive, and
 * conversational guidance.
 */
export function sweetCoatAIFeedback(text: string | null | undefined): string {
  if (!text) return "";

  let result = text;

  // Replacements dictionary for supportive phrasing
  const replacements: Array<[RegExp, string]> = [
    [/\b(?:Warning|WARNING|Alert|ALERT)\b:?/gi, "Oh wait! 🚨"],
    [/\bDanger(?:ous)?\b/gi, "Extra mindful spot ✨"],
    [/\bHigh Risk\b/gi, "Needs a little extra care 🛡️"],
    [/\bRisk(?:\s+factor)?\b/gi, "Consideration 💡"],
    [/\bAvoid(?:ing)?\b/gi, "Maybe steer clear of 🌸"],
    [/\bHazard(?:ous)?\b/gi, "Tricky patch ⚠️"],
    [/\bUnsafe\b/gi, "Low comfort area 🌙"],
    [/\bPoorly lit\b/gi, "Dimly lit stretch 💡"],
    [/\bIsolated\b/gi, "Quiet & less bustling 🍃"],
    [/\bAttention Notice:?/gi, "Gentle reminder 🌸"],
    [/\bAttention Zones?:?/gi, "Careful spots 🌸"],
    [/\bCrime\b/gi, "Activity pattern 🔍"],
    [/\bRecommended\b/gi, "Most comfortable pick 🌸"],
    [/\bAlternative\b/gi, "Gentle option 💫"],
  ];

  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

/**
 * Returns a warm summary tip based on safety score.
 */
export function getCompanionTip(score: number): string {
  if (score >= 80) {
    return "This path looks wonderfully vibrant and well-accompanied! 🌸 You're good to stroll!";
  }
  if (score >= 60) {
    return "A reasonably pleasant route! Keep your head up near the quieter crossings. ✨";
  }
  return "Oh wait! 🚨 Some parts look pretty quiet and dimly lit right now. Let's stick to the brighter avenue!";
}
