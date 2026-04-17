import numpy as np
import pandas as pd
from feature_engineering import *

def generate_data(n=10000):
    data_list = []

    for _ in range(n):
        row = {
            "unsafe_driving_ratio": np.random.rand(),
            "risk_events_per_km": np.random.rand(),
            "night_driving_ratio": np.random.rand(),
            "max_speed": np.random.uniform(40, 120),

            "completion_rate": np.random.rand(),
            "acceptance_rate": np.random.rand(),
            "cancellation_ratio": np.random.rand(),

            "avg_rating": np.random.uniform(2, 5),
            "negative_feedback_ratio": np.random.rand(),

            "active_days_per_week": np.random.randint(1, 7),
            "work_variance": np.random.rand(),
            "streak_days": np.random.randint(1, 30),

            "fraud_flag": np.random.choice([0, 1], p=[0.9, 0.1]),
            "claims_per_month": np.random.rand(),
            "high_value_claim_ratio": np.random.rand(),

            "avg_location_risk": np.random.rand(),
            "weather_risk": np.random.rand(),
            "traffic_density": np.random.rand()
        }

        features = build_feature_vector(row)

        # Synthetic target
        gts = 300 + 600 * (
            0.3 * features[0] +
            0.2 * features[1] +
            0.15 * features[2] +
            0.15 * features[3] +
            0.2 * features[4]
        )

        gts += np.random.uniform(-20, 20)

        row["GTS"] = gts
        data_list.append(row)

    return pd.DataFrame(data_list)