import numpy as np

# Normalize helper
def safe_div(a, b):
    return a / b if b != 0 else 0


def compute_safety_score(data):
    return max(0, 1 - (
        0.3 * data["unsafe_driving_ratio"] +
        0.3 * data["risk_events_per_km"] +
        0.2 * data["night_driving_ratio"] +
        0.2 * (data["max_speed"] / 120)
    ))


def compute_reliability_score(data):
    return (
        0.4 * data["completion_rate"] +
        0.3 * data["acceptance_rate"] +
        0.3 * (1 - data["cancellation_ratio"])
    )


def compute_rating_score(data):
    return (data["avg_rating"] / 5) * (1 - data["negative_feedback_ratio"])


def compute_consistency_score(data):
    return (
        0.4 * (data["active_days_per_week"] / 7) +
        0.3 * (1 - data["work_variance"]) +
        0.3 * (data["streak_days"] / 30)
    )


def compute_claims_score(data):
    return max(0, 1 - (
        0.5 * data["fraud_flag"] +
        0.3 * data["claims_per_month"] +
        0.2 * data["high_value_claim_ratio"]
    ))


def build_feature_vector(data):
    safety = compute_safety_score(data)
    reliability = compute_reliability_score(data)
    rating = compute_rating_score(data)
    consistency = compute_consistency_score(data)
    claims = compute_claims_score(data)

    return np.array([
        safety,
        reliability,
        rating,
        consistency,
        claims,
        data["fraud_flag"],
        data["claims_per_month"],
        data["avg_location_risk"],
        data["weather_risk"],
        data["traffic_density"]
    ])