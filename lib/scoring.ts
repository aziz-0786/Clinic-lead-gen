/**
 * Intent scoring for patient inquiries.
 * Urgency is weighted highest because a same-day emergency
 * is worth far more clinic time than a casual browser.
 */

export type Urgency = "EMERGENCY_TODAY" | "THIS_WEEK" | "THIS_MONTH" | "JUST_EXPLORING";
export type IntentLabel = "HIGH" | "MEDIUM" | "LOW";

export interface ScoringInput {
  urgency: Urgency;
  concernMatchesSpecialty: boolean;
  patientType: "New" | "Returning";
  hasPhone: boolean;
  hasEmail: boolean;
}

export function computeIntentScore(input: ScoringInput): { score: number; label: IntentLabel } {
  let score = 0;

  // Urgency — most heavily weighted signal
  const urgencyPoints: Record<Urgency, number> = {
    EMERGENCY_TODAY: 45,
    THIS_WEEK: 25,
    THIS_MONTH: 10,
    JUST_EXPLORING: 0,
  };
  score += urgencyPoints[input.urgency];

  // Concern matches clinic's primary specialty → indicates intent fit
  if (input.concernMatchesSpecialty) score += 15;

  // Returning patient has prior relationship → higher conversion likelihood
  if (input.patientType === "Returning") score += 15;

  // Complete contact info → they're willing to be reached
  if (input.hasPhone && input.hasEmail) score += 25;
  else if (input.hasPhone) score += 10;

  score = Math.min(100, Math.max(0, score));

  const label: IntentLabel = score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
  return { score, label };
}
