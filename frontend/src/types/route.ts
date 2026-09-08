export interface FeatureScores {
  activity: number;
  businesses: number;
  emergency: number;
  time: number;
  isolation: number;
  surveillance: number;
  network: number;
  transit: number;
  lighting: number;
}

export interface AttentionZone {
  segment_start_index: number;
  segment_end_index: number;
  score: number;
  severity: "moderate" | "caution" | "attention";
  primary_reasons: string[];
  representative_coordinate: [number, number];
  coordinates: [number, number][];
}

export interface ExplanationDetail {
  status?: string;
  model_used?: string;
  headline?: string;
  summary?: string;
  why_recommended?: string[];
  tradeoffs?: string[];
  attention_summary?: string[];
}

export interface SegmentDetail {
  id: string;
  segment_index: number;
  length_m: number;
  segment_score: number;
  confidence: string;
  scores: FeatureScores;
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
  reasons: string[];
  provenance?: Record<string, any>;
}

export interface RouteDetail {
  id: string;
  name: string;
  distance_m: number;
  duration_seconds: number;
  score: number;
  confidence: string;
  features: FeatureScores;
  attention_zones: AttentionZone[];
  segments: SegmentDetail[];
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
  source?: string;
  validation?: {
    is_valid: boolean;
    status: string;
    reasons: string[];
    detour_ratio?: number;
    eta_ratio?: number;
  };
}

export interface RouteAnalysisResponse {
  request_id: string;
  travel_datetime: string;
  recommended_route_id: string;
  routes: RouteDetail[];
  explanation: string | ExplanationDetail;
  explanation_source?: string;
}

export interface RouteAnalysisRequest {
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  origin_address?: string;
  destination_address?: string;
  travel_datetime: string;
  priority_safety: boolean;
}
