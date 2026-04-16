export const SCORE_RANGES = {
  HOT: { min: 70, max: 100, label: 'Hot', emoji: '🔥' },
  WARM: { min: 40, max: 69, label: 'Warm', emoji: '🟡' },
  COLD: { min: 10, max: 39, label: 'Cold', emoji: '🔵' },
  DEAD: { min: 0, max: 9, label: 'Dead', emoji: '⚪' },
} as const;

export function getScoreCategory(score: number): 'hot' | 'warm' | 'cold' | 'dead' {
  if (score >= SCORE_RANGES.HOT.min) return 'hot';
  if (score >= SCORE_RANGES.WARM.min) return 'warm';
  if (score >= SCORE_RANGES.COLD.min) return 'cold';
  return 'dead';
}

// Points awarded for various signals
export const SCORE_POINTS = {
  // AI signals (from Retell)
  INTEREST_HIGH: 25,
  INTEREST_MEDIUM: 15,
  INTEREST_LOW: 5,
  IS_SERIOUS_BUYER: 20,
  SENTIMENT_POSITIVE: 10,
  SENTIMENT_NEUTRAL: 3,

  // Rule-based
  BUDGET_DEFINED: 10,
  TIMELINE_URGENT: 15,
  MEETING_BOOKED: 20,
  RESPONDED_TO_FOLLOWUP: 10,
  MULTIPLE_CALLS: 5,
  PROPERTY_MATCHED: 5,
} as const;
