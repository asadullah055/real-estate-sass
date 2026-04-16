import { SCORE_POINTS, getScoreCategory } from '../../common/constants/scoreRanges.js';

export interface ScoringInput {
  retellData?: {
    interestLevel?: 'high' | 'medium' | 'low';
    isSeriousBuyer?: boolean;
    sentiment?: 'positive' | 'neutral' | 'negative';
  };
  budget?: { min?: number; max?: number };
  timeline?: 'urgent' | 'within_3_months' | 'within_6_months' | 'flexible';
  meetingBooked?: boolean;
  callCount?: number;
  hasRespondedToFollowup?: boolean;
  propertyMatchCount?: number;
}

export interface ScoringResult {
  score: number;
  scoreCategory: 'hot' | 'warm' | 'cold' | 'dead';
  breakdown: Record<string, number>;
}

/** Inline lead scoring — simple math, < 2ms. Not a background job. */
export function calculateLeadScore(input: ScoringInput): ScoringResult {
  const breakdown: Record<string, number> = {};
  let total = 0;

  // AI signals
  if (input.retellData?.interestLevel === 'high') {
    breakdown.interest_high = SCORE_POINTS.INTEREST_HIGH;
    total += SCORE_POINTS.INTEREST_HIGH;
  } else if (input.retellData?.interestLevel === 'medium') {
    breakdown.interest_medium = SCORE_POINTS.INTEREST_MEDIUM;
    total += SCORE_POINTS.INTEREST_MEDIUM;
  } else if (input.retellData?.interestLevel === 'low') {
    breakdown.interest_low = SCORE_POINTS.INTEREST_LOW;
    total += SCORE_POINTS.INTEREST_LOW;
  }

  if (input.retellData?.isSeriousBuyer) {
    breakdown.serious_buyer = SCORE_POINTS.IS_SERIOUS_BUYER;
    total += SCORE_POINTS.IS_SERIOUS_BUYER;
  }

  if (input.retellData?.sentiment === 'positive') {
    breakdown.sentiment_positive = SCORE_POINTS.SENTIMENT_POSITIVE;
    total += SCORE_POINTS.SENTIMENT_POSITIVE;
  } else if (input.retellData?.sentiment === 'neutral') {
    breakdown.sentiment_neutral = SCORE_POINTS.SENTIMENT_NEUTRAL;
    total += SCORE_POINTS.SENTIMENT_NEUTRAL;
  }

  // Rule-based signals
  if (input.budget?.max || input.budget?.min) {
    breakdown.budget_defined = SCORE_POINTS.BUDGET_DEFINED;
    total += SCORE_POINTS.BUDGET_DEFINED;
  }

  if (input.timeline === 'urgent') {
    breakdown.timeline_urgent = SCORE_POINTS.TIMELINE_URGENT;
    total += SCORE_POINTS.TIMELINE_URGENT;
  }

  if (input.meetingBooked) {
    breakdown.meeting_booked = SCORE_POINTS.MEETING_BOOKED;
    total += SCORE_POINTS.MEETING_BOOKED;
  }

  if (input.hasRespondedToFollowup) {
    breakdown.responded_followup = SCORE_POINTS.RESPONDED_TO_FOLLOWUP;
    total += SCORE_POINTS.RESPONDED_TO_FOLLOWUP;
  }

  if ((input.callCount ?? 0) > 1) {
    breakdown.multiple_calls = SCORE_POINTS.MULTIPLE_CALLS;
    total += SCORE_POINTS.MULTIPLE_CALLS;
  }

  if ((input.propertyMatchCount ?? 0) > 0) {
    breakdown.property_matched = SCORE_POINTS.PROPERTY_MATCHED;
    total += SCORE_POINTS.PROPERTY_MATCHED;
  }

  const score = Math.min(100, Math.max(0, total));
  return { score, scoreCategory: getScoreCategory(score), breakdown };
}
