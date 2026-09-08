import { RouteDetail, FeatureScores } from "@/types/route";

export interface FactorDefinition {
  key: keyof FeatureScores;
  weight: number;
  label: string;
  strengthText: string;
  concernTextAlt: string;
  concernTextRec: string;
  matchers: RegExp[];
}

export const FACTOR_DEFINITIONS: FactorDefinition[] = [
  {
    key: "activity",
    weight: 0.20,
    label: "Public Activity",
    strengthText: "Higher public activity",
    concernTextAlt: "Lower public activity",
    concernTextRec: "Low activity on a short segment",
    matchers: [/public activity/i, /pedestrian/i, /ambient.*activity/i, /few people/i, /activity proxy/i],
  },
  {
    key: "emergency",
    weight: 0.20,
    label: "Emergency Access",
    strengthText: "Closer proximity to emergency services",
    concernTextAlt: "Reduced emergency accessibility",
    concernTextRec: "Emergency infrastructure at greater distance on stretch",
    matchers: [/emergency/i, /police/i, /hospital/i, /fire station/i],
  },
  {
    key: "businesses",
    weight: 0.15,
    label: "Open Businesses",
    strengthText: "Active open commercial businesses",
    concernTextAlt: "Fewer open businesses",
    concernTextRec: "Fewer open businesses on secondary stretch",
    matchers: [/commercial/i, /businesses/i, /facilities/i, /shops/i, /stores/i],
  },
  {
    key: "isolation",
    weight: 0.14,
    label: "Corridor Connectivity",
    strengthText: "Strong corridor connectivity (low isolation)",
    concernTextAlt: "Higher isolation index",
    concernTextRec: "Brief isolated stretch along corridor",
    matchers: [/isolation/i, /isolated/i],
  },
  {
    key: "transit",
    weight: 0.10,
    label: "Public Transit",
    strengthText: "Active public transit connectivity",
    concernTextAlt: "Reduced public transit operating schedule",
    concernTextRec: "Reduced transit schedule at this hour",
    matchers: [/transit/i, /bus/i, /metro/i, /operating schedule/i],
  },
  {
    key: "surveillance",
    weight: 0.09,
    label: "Surveillance Presence",
    strengthText: "Higher estimated surveillance presence",
    concernTextAlt: "Lower surveillance presence",
    concernTextRec: "Limited surveillance cameras on section",
    matchers: [/surveillance/i, /cctv/i, /camera/i],
  },
  {
    key: "network",
    weight: 0.06,
    label: "Mobile Network",
    strengthText: "Strong mobile network connectivity",
    concernTextAlt: "Lower mobile network signal",
    concernTextRec: "Variable mobile network coverage on stretch",
    matchers: [/network/i, /signal/i, /cellular/i, /coverage/i],
  },
  {
    key: "lighting",
    weight: 0.04,
    label: "Street Lighting",
    strengthText: "Better lighting coverage",
    concernTextAlt: "Poorer lighting on some segments",
    concernTextRec: "Unverified or reduced lighting on a short stretch",
    matchers: [/lighting/i, /unverified.*light/i, /reduced.*light/i, /street.*light/i, /dark/i],
  },
  {
    key: "time",
    weight: 0.02,
    label: "Time Context",
    strengthText: "Favorable travel time conditions",
    concernTextAlt: "Late-night reduced ambient context",
    concernTextRec: "Late-night reduced ambient activity",
    matchers: [/time context/i, /night/i, /temporal/i, /hour/i],
  },
];

export interface FactorItem {
  id: string;
  category: keyof FeatureScores;
  label: string;
  text: string;
  severity: number; // 0 to 1
  impact: number;   // severity * weight
  isLocalized: boolean;
}

export interface RouteComparisonData {
  strengths: string[];
  prominentConcerns: FactorItem[];
  minorConcerns: FactorItem[];
  totalConcernCount: number;
  whyNotRecommended?: string;
  relativeScoreDiff?: number;
  relativeEtaDiffMin?: number;
  disclaimerText: string;
}

/**
 * Normalizes effective factor score from route features.
 * (For all positive features: higher is better; for isolation: 100 - isolation index).
 */
function getEffectiveFeatureScore(features: FeatureScores, key: keyof FeatureScores): number {
  if (key === "isolation") {
    // isolation in features is the isolation index (0 to 100, where higher is more isolated)
    // Positive connectivity score is 100 - isolation
    return Math.max(0, Math.min(100, 100 - (features.isolation ?? 50)));
  }
  return Math.max(0, Math.min(100, features[key] ?? 50));
}

/**
 * Analyzes and ranks factors for a route using deterministic scores.
 * Deduplicates related reasons and applies differentiated presentation rules.
 */
export function analyzeRouteFactors(
  route: RouteDetail,
  isRecommended: boolean,
  recommendedRoute?: RouteDetail
): RouteComparisonData {
  const features = route.features || {
    activity: 50,
    businesses: 50,
    emergency: 50,
    time: 50,
    isolation: 50,
    surveillance: 50,
    network: 50,
    transit: 50,
    lighting: 50,
  };

  // 1. Determine which categories have localized attention zone flags
  const localizedCategories = new Set<keyof FeatureScores>();
  if (route.attention_zones && route.attention_zones.length > 0) {
    for (const az of route.attention_zones) {
      const reasons = az.primary_reasons || [];
      for (const reason of reasons) {
        for (const def of FACTOR_DEFINITIONS) {
          if (def.matchers.some((m) => m.test(reason))) {
            localizedCategories.add(def.key);
          }
        }
      }
    }
  }

  // 2. Compute negative factors ranked strictly by impact = severity * weight
  const candidateConcerns: FactorItem[] = [];

  for (const def of FACTOR_DEFINITIONS) {
    const effectiveScore = getEffectiveFeatureScore(features, def.key);
    const hasLocalizedIssue = localizedCategories.has(def.key);

    // Consider factor a negative concern if score < 68, or if there's a localized attention zone
    if (effectiveScore < 68 || hasLocalizedIssue) {
      // Calculate severity on 0..1 scale
      // Below 68, deficit scales up to 1.0 at score 0
      const scoreDeficit = Math.max(0, (75 - effectiveScore) / 75);
      // Give additional bump if specifically flagged in an attention zone
      const localizedBump = hasLocalizedIssue ? 0.15 : 0.0;
      const severity = Math.min(1.0, scoreDeficit + localizedBump);
      const impact = severity * def.weight;

      const text = isRecommended ? def.concernTextRec : def.concernTextAlt;

      candidateConcerns.push({
        id: def.key,
        category: def.key,
        label: def.label,
        text,
        severity: Math.round(severity * 100) / 100,
        impact: Math.round(impact * 1000) / 1000,
        isLocalized: hasLocalizedIssue,
      });
    }
  }

  // Sort concerns descending by impact (highest impact on score first)
  candidateConcerns.sort((a, b) => b.impact - a.impact);

  // 3. Extract positive strengths (features with score >= 60, weighted)
  const strengthCandidates: { text: string; strength: number }[] = [];
  for (const def of FACTOR_DEFINITIONS) {
    const effectiveScore = getEffectiveFeatureScore(features, def.key);
    if (effectiveScore >= 60 && !localizedCategories.has(def.key)) {
      strengthCandidates.push({
        text: def.strengthText,
        strength: (effectiveScore / 100) * def.weight,
      });
    }
  }
  // Sort strengths descending
  strengthCandidates.sort((a, b) => b.strength - a.strength);
  const strengths = strengthCandidates.slice(0, 2).map((s) => s.text);

  // Fallback strength if none exceeded 60
  if (strengths.length === 0 && isRecommended) {
    strengths.push("Highest overall environmental context score among alternatives");
  }

  // 4. Apply display limits according to role:
  // Recommended: 1 to 2 prominent concerns max; hide others
  // Alternative: 2 to 3 prominent concerns visible immediately
  let prominentConcerns: FactorItem[] = [];
  let minorConcerns: FactorItem[] = [];

  if (isRecommended) {
    // Show only the 1-2 most significant concerns, filtering out very negligible ones
    const meaningful = candidateConcerns.filter((c) => c.impact >= 0.015);
    prominentConcerns = meaningful.slice(0, 2);
    minorConcerns = candidateConcerns.slice(prominentConcerns.length);
  } else {
    // Alternative route: show 2-3 most significant concerns immediately
    prominentConcerns = candidateConcerns.slice(0, 3);
    minorConcerns = candidateConcerns.slice(prominentConcerns.length);
  }

  // 5. Build concise "Why not recommended" explanation for alternatives
  let whyNotRecommended: string | undefined = undefined;
  let relativeScoreDiff: number | undefined = undefined;
  let relativeEtaDiffMin: number | undefined = undefined;

  if (!isRecommended && recommendedRoute) {
    const recScore = Math.round(recommendedRoute.score);
    const altScore = Math.round(route.score);
    relativeScoreDiff = altScore - recScore; // e.g. -12

    const recDur = recommendedRoute.duration_seconds;
    const altDur = route.duration_seconds;
    relativeEtaDiffMin = Math.round((altDur - recDur) / 60);

    const topFactors = candidateConcerns.slice(0, 2).map((c) => c.label.toLowerCase());

    if (topFactors.length > 0) {
      whyNotRecommended = `Lower contextual score (${altScore} vs ${recScore}) due to reduced ${topFactors.join(" and ")}.`;
    } else {
      whyNotRecommended = `Lower overall context score (${altScore} vs ${recScore}) compared to recommended corridor.`;
    }

    // Add ETA context if there's a tradeoff
    if (relativeEtaDiffMin < -1) {
      whyNotRecommended += ` (~${Math.abs(relativeEtaDiffMin)} min faster, but with notable safety compromises).`;
    }
  }

  const disclaimerText = isRecommended
    ? "Relative comparison among alternatives • Does not guarantee zero risk"
    : "Evaluated against environmental context benchmarks";

  return {
    strengths,
    prominentConcerns,
    minorConcerns,
    totalConcernCount: candidateConcerns.length,
    whyNotRecommended,
    relativeScoreDiff,
    relativeEtaDiffMin,
    disclaimerText,
  };
}
