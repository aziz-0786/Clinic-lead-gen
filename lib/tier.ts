export type Tier = "STARTER" | "GROWTH" | "PRO";

export interface TierFeatures {
  emailAlertsHighIntent: boolean;
  whatsappAlertsHighIntent: boolean;
  monthlyReportFull: boolean;
  missedOpportunityCalculator: boolean;
  followUpAutomation: boolean;
}

export function getTierFeatures(tier: string): TierFeatures {
  switch (tier as Tier) {
    case "PRO":
      return {
        emailAlertsHighIntent: true,
        whatsappAlertsHighIntent: true,
        monthlyReportFull: true,
        missedOpportunityCalculator: true,
        followUpAutomation: true,
      };
    case "GROWTH":
      return {
        emailAlertsHighIntent: true,
        whatsappAlertsHighIntent: false,
        monthlyReportFull: true,
        missedOpportunityCalculator: false,
        followUpAutomation: true,
      };
    default: // STARTER
      return {
        emailAlertsHighIntent: false,
        whatsappAlertsHighIntent: false,
        monthlyReportFull: false,
        missedOpportunityCalculator: false,
        followUpAutomation: false,
      };
  }
}

export const TIER_LABELS: Record<Tier, string> = {
  STARTER: "Starter",
  GROWTH: "Growth",
  PRO: "Pro",
};

export const TIER_COLORS: Record<Tier, string> = {
  STARTER: "bg-slate-100 text-slate-700",
  GROWTH: "bg-blue-100 text-blue-700",
  PRO: "bg-purple-100 text-purple-700",
};
