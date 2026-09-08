import { RouteAnalysisRequest, RouteAnalysisResponse } from "@/types/route";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export async function fetchRouteAnalysis(req: RouteAnalysisRequest): Promise<RouteAnalysisResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${API_BASE}/routes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`Failed to analyze route (${res.status}): ${errText}`);
    }

    return await res.json();
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Route analysis timed out after 30 seconds. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function submitObservation(data: {
  segment_id?: string;
  lat?: number;
  lng?: number;
  type: string;
  value: string;
}): Promise<{ id: string; status: string; message: string }> {
  const res = await fetch(`${API_BASE}/observations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to submit observation");
  }

  return res.json();
}

export interface LocationSuggestion {
  display_name: string;
  lat: number;
  lng: number;
  city?: string;
  type?: string;
}

export async function fetchLocationSuggestions(query: string): Promise<LocationSuggestion[]> {
  if (!query || query.trim().length < 1) return [];
  try {
    const res = await fetch(`${API_BASE}/geocoding/search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("[AAROH GEO] Location suggestion fetch failed:", err);
  }
  return [];
}
