def normalize_score(value: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    """Normalizes any input score into strict 0.0 to 100.0 range."""
    if value is None:
        return 50.0
    return max(min_val, min(max_val, float(value)))
