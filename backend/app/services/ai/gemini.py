import json
import re
from typing import Dict, Any, List, Optional
from concurrent.futures import ThreadPoolExecutor
from app.core.config import settings
from app.core.logging import logger

def build_ai_context_summary(
    routes: List[Dict[str, Any]],
    recommended_id: str,
    travel_time_str: Optional[str] = None
) -> Dict[str, Any]:
    """
    Constructs a compact, token-efficient factual summary for Gemini AI.
    NEVER includes raw coordinate arrays or verbose segment polylines.
    """
    compact_routes = []
    for r in routes:
        feats = r.get("features", {})
        att_zones = r.get("attention_zones", [])
        
        # Determine dominant context strengths and weaknesses
        strengths = []
        cautions = []
        if feats.get("emergency", 0) >= 70:
            strengths.append("High proximity to emergency services")
        if feats.get("businesses", 0) >= 65:
            strengths.append("Active open commercial businesses")
        if feats.get("lighting", 0) >= 65:
            strengths.append("Verified street lighting infrastructure")
        if feats.get("transit", 0) >= 65:
            strengths.append("Active transit connectivity")
            
        if feats.get("isolation", 0) >= 50:
            cautions.append("Higher isolation index corridor")
        if feats.get("lighting", 0) <= 50:
            cautions.append("Unverified or low ambient lighting")
        if len(att_zones) > 0:
            cautions.append(f"{len(att_zones)} attention zone(s) identified")

        compact_routes.append({
            "id": r.get("id"),
            "name": r.get("name"),
            "distance_km": round(float(r.get("distance_m", 0.0)) / 1000.0, 1),
            "eta_minutes": round(float(r.get("duration_seconds", 0.0)) / 60.0, 1),
            "context_score": round(float(r.get("score", 50.0)), 1),
            "confidence": r.get("confidence", "MEDIUM"),
            "source": r.get("source", "osrm"),
            "features": {
                "activity_proxy": feats.get("activity", 50),
                "businesses": feats.get("businesses", 50),
                "emergency": feats.get("emergency", 50),
                "lighting": feats.get("lighting", 50),
                "surveillance": feats.get("surveillance", 50),
                "transit": feats.get("transit", 50),
                "network": feats.get("network", 50),
                "isolation": feats.get("isolation", 50)
            },
            "strengths": strengths,
            "cautions": cautions,
            "attention_zones_count": len(att_zones)
        })

    return {
        "travel_time": travel_time_str or "Live",
        "recommended_route_id": recommended_id,
        "candidate_routes": compact_routes
    }

def generate_deterministic_explanation(
    routes: List[Dict[str, Any]],
    recommended_id: str
) -> Dict[str, Any]:
    """
    Deterministic rule-based explanation generator matching the structured JSON schema.
    Used when Gemini is unavailable, times out, or encounters errors.
    """
    rec = next((r for r in routes if r["id"] == recommended_id), routes[0] if routes else None)
    if not rec:
        return {
            "status": "deterministic_fallback",
            "model_used": "rule_engine_v1",
            "headline": "Route context evaluation completed.",
            "summary": "Context evaluation completed using deterministic scoring.",
            "why_recommended": ["Balanced baseline connectivity across corridors."],
            "tradeoffs": ["Standard navigation corridor."],
            "attention_summary": []
        }

    rec_name = rec.get("name", "Recommended Route")
    rec_score = rec.get("score", 50.0)
    rec_eta = round(rec.get("duration_seconds", 600.0) / 60.0, 1)
    rec_feats = rec.get("features", {})
    rec_att = rec.get("attention_zones", [])

    why_recs = []
    if rec_feats.get("emergency", 0) > 65:
        why_recs.append("Closer proximity to verified emergency support infrastructure.")
    if rec_feats.get("businesses", 0) > 65:
        why_recs.append("Higher estimated open commercial activity along the main corridor.")
    if rec_feats.get("lighting", 0) > 60:
        why_recs.append("Better verified streetlight coverage.")
    if not why_recs:
        why_recs.append(f"Highest weighted environmental context score ({rec_score}/100) among alternatives.")

    tradeoffs = []
    # Check if another route was faster
    faster_route = next((r for r in routes if r["id"] != recommended_id and r["duration_seconds"] < rec["duration_seconds"]), None)
    if faster_route:
        diff_min = round((rec["duration_seconds"] - faster_route["duration_seconds"]) / 60.0, 1)
        tradeoffs.append(f"Adds ~{diff_min} min compared to {faster_route['name']}, but offers stronger contextual support.")
    else:
        tradeoffs.append("Provides the most favorable balance of ETA and contextual factors.")

    att_summary = []
    if rec_att:
        for az in rec_att[:1]:
            # Keep recommended attention notice focused on 1-2 key items
            reasons_list = az.get("primary_reasons", ["Reduced ambient activity"])[:2]
            reasons = ", ".join(reasons_list)
            att_summary.append(f"Segments #{az.get('segment_start_index')}-{az.get('segment_end_index')}: {reasons}")
    else:
        att_summary.append("No major attention zones detected along this route.")

    headline = f"{rec_name} recommended with a Context Score of {rec_score}/100."
    summary = f"Recommended based on deterministic environmental scoring with an estimated travel time of {rec_eta} minutes."

    return {
        "status": "deterministic_fallback",
        "model_used": "rule_engine_v1",
        "headline": headline,
        "summary": summary,
        "why_recommended": why_recs,
        "tradeoffs": tradeoffs,
        "attention_summary": att_summary
    }

def _call_gemini_api(api_key: str, context_summary: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    from google import genai
    client = genai.Client(api_key=api_key)

    system_prompt = (
        "You are the contextual explanation engine for AAROH, a personal navigation platform in India.\n"
        "RULES:\n"
        "1. GROUNDING: Reason ONLY from the supplied JSON numbers and metadata. Do NOT invent facts.\n"
        "2. NO INVENTED POIs: Do NOT invent businesses, police posts, CCTV, or lighting.\n"
        "3. NO SAFETY CLAIMS: Never claim '100% safe', 'guaranteed safety', or 'crime prediction'. Use objective terms: 'well-lit corridor', 'isolated stretch', 'active commercial presence'. Clarify this is a relative evaluation among alternatives.\n"
        "4. BALANCED ATTENTION: For attention_summary, mention at most 1-2 localized compromises for the recommended route. Do not overwhelm the recommendation with repetitive negatives.\n"
        "5. OUTPUT FORMAT: Respond ONLY with valid JSON conforming to this schema:\n"
        "{\n"
        '  "headline": "<1 concise headline>",\n'
        '  "summary": "<1-2 sentence overall summary>",\n'
        '  "why_recommended": ["<point 1>", "<point 2>"],\n'
        '  "tradeoffs": ["<tradeoff description>"],\n'
        '  "attention_summary": ["<at most 1-2 concise attention points>"]\n'
        "}"
    )

    user_payload = json.dumps(context_summary, indent=2)

    for m_name in ['gemini-3.6-flash', 'gemini-2.5-flash']:
        try:
            response = client.models.generate_content(
                model=m_name,
                contents=f"{system_prompt}\n\nSupplied Route Context Data:\n{user_payload}"
            )
            if response and response.text:
                clean_text = response.text.strip()
                # Clean markdown codeblocks if wrapped in ```json ... ```
                if clean_text.startswith("```"):
                    clean_text = re.sub(r"^```(?:json)?\s*", "", clean_text)
                    clean_text = re.sub(r"\s*```$", "", clean_text)
                
                parsed = json.loads(clean_text)
                if isinstance(parsed, dict) and "headline" in parsed:
                    parsed["status"] = "ai_generated"
                    parsed["model_used"] = m_name
                    return parsed
        except Exception as e:
            logger.warning(f"[GEMINI] Call with {m_name} failed: {e}")
            break

    return None

def generate_route_explanation(
    routes: List[Dict[str, Any]],
    recommended_id: str,
    travel_time_str: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates structured natural language explanation.
    Uses Gemini AI if available within a 2.5s cap; otherwise falls back
    to deterministic rule engine. Never breaks or delays route response.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return generate_deterministic_explanation(routes, recommended_id)

    executor = ThreadPoolExecutor(max_workers=1)
    try:
        context_summary = build_ai_context_summary(routes, recommended_id, travel_time_str)
        future = executor.submit(_call_gemini_api, api_key, context_summary)
        res = future.result(timeout=2.5)
        if res:
            return res
    except Exception as e:
        logger.warning(f"[GEMINI] Explanation timed out or failed: {e}. Using deterministic fallback.")
    finally:
        try:
            executor.shutdown(wait=False, cancel_futures=True)
        except Exception:
            pass

    return generate_deterministic_explanation(routes, recommended_id)

