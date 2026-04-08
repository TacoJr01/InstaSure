"""
InstaSure Risk Assessment ML Model
Trains a Random Forest to predict: risk_score, trust_score, weekly_premium, coverage
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, classification_report
import joblib
import json

# ── 1. GENERATE SYNTHETIC TRAINING DATA ────────────────────────────────────
np.random.seed(42)
N = 20000

def generate_dataset(n):
    worker_types     = np.random.choice(['food', 'ecommerce', 'qcommerce'], n)
    location_risks   = np.random.choice(['low', 'medium', 'high'], n)
    temperature      = np.random.uniform(20, 48, n)
    rainfall         = np.random.exponential(30, n).clip(0, 300)
    aqi              = np.random.uniform(50, 450, n)
    curfew_prob      = np.random.uniform(0, 1, n)
    zone_closure     = np.random.uniform(0, 1, n)
    hist_disruption  = np.random.uniform(0, 100, n)
    gps_valid        = np.random.choice([True, False], n, p=[0.85, 0.15])
    claim_history    = np.random.uniform(0, 100, n)
    spoofing_risk    = np.random.uniform(0, 100, n)

    # Rule-based labels (ground truth for training)
    env_score = (
        (temperature > 40).astype(float) * 10 +
        (rainfall > 100).astype(float) * 15 +
        (aqi > 300).astype(float) * 10 +
        (hist_disruption / 100) * 5
    ).clip(0, 40)

    social_score = (curfew_prob * 10 + zone_closure * 10).clip(0, 20)

    loc_score = (
        np.where(location_risks == 'high', 15, np.where(location_risks == 'medium', 8, 0)) +
        np.where(worker_types == 'qcommerce', 7, np.where(worker_types == 'food', 5, 3))
    ).clip(0, 20)

    raw = env_score + social_score + loc_score
    risk_score = ((raw / 80) * 100).clip(0, 100).round()

    trust_score = (
        100
        - (~gps_valid).astype(float) * 40
        - spoofing_risk * 0.5
        - (100 - claim_history) * 0.3
    ).clip(0, 100).round()

    premium = np.where(risk_score < 30, 25, np.where(risk_score <= 60, 40, 60))
    premium = np.where(trust_score < 50, premium + 10, premium)
    premium = np.where(trust_score > 80, premium - 5, premium)
    premium = premium.clip(20, 80)

    coverage = np.where(risk_score < 30, 200, np.where(risk_score <= 60, 300, 500))

    # Add noise to simulate real-world variance
    risk_score  = (risk_score  + np.random.normal(0, 3, n)).clip(0, 100).round()
    trust_score = (trust_score + np.random.normal(0, 3, n)).clip(0, 100).round()

    return pd.DataFrame({
        'worker_type':                worker_types,
        'location_risk':              location_risks,
        'temperature_celsius':        temperature,
        'rainfall_mm':                rainfall,
        'aqi':                        aqi,
        'curfew_probability':         curfew_prob,
        'zone_closure_probability':   zone_closure,
        'historical_disruption_score':hist_disruption,
        'gps_valid':                  gps_valid.astype(int),
        'claim_history_score':        claim_history,
        'spoofing_risk':              spoofing_risk,
        # labels
        'risk_score':    risk_score,
        'trust_score':   trust_score,
        'weekly_premium':premium,
        'coverage':      coverage,
    })

df = generate_dataset(N)
print(f"Dataset: {len(df)} rows\n{df.describe().round(1)}\n")

# ── 2. ENCODE CATEGORICALS ─────────────────────────────────────────────────
le_worker   = LabelEncoder().fit(['ecommerce', 'food', 'qcommerce'])
le_location = LabelEncoder().fit(['high', 'low', 'medium'])

df['worker_type_enc']   = le_worker.transform(df['worker_type'])
df['location_risk_enc'] = le_location.transform(df['location_risk'])

FEATURES = [
    'worker_type_enc', 'location_risk_enc',
    'temperature_celsius', 'rainfall_mm', 'aqi',
    'curfew_probability', 'zone_closure_probability',
    'historical_disruption_score', 'gps_valid',
    'claim_history_score', 'spoofing_risk',
]

X = df[FEATURES]

# ── 3. TRAIN MODELS ────────────────────────────────────────────────────────
print("Training models...")

# Risk score — regression
X_train, X_test, y_train, y_test = train_test_split(X, df['risk_score'], test_size=0.2, random_state=42)
risk_model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
risk_model.fit(X_train, y_train)
risk_preds = risk_model.predict(X_test).clip(0, 100).round()
print(f"Risk Score   MAE: {mean_absolute_error(y_test, risk_preds):.2f}")

# Trust score — regression
X_train, X_test, y_train, y_test = train_test_split(X, df['trust_score'], test_size=0.2, random_state=42)
trust_model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
trust_model.fit(X_train, y_train)
trust_preds = trust_model.predict(X_test).clip(0, 100).round()
print(f"Trust Score  MAE: {mean_absolute_error(y_test, trust_preds):.2f}")

# Premium — classifier (discrete buckets: 20,25,30,35,40,45,50,55,60,65,70,75,80)
X_train, X_test, y_train, y_test = train_test_split(X, df['weekly_premium'], test_size=0.2, random_state=42)
premium_model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
premium_model.fit(X_train, y_train)
print(f"Premium      Accuracy: {premium_model.score(X_test, y_test):.2%}")

# Coverage — classifier (200, 300, 500)
X_train, X_test, y_train, y_test = train_test_split(X, df['coverage'], test_size=0.2, random_state=42)
coverage_model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42, n_jobs=-1)
coverage_model.fit(X_train, y_train)
print(f"Coverage     Accuracy: {coverage_model.score(X_test, y_test):.2%}\n")

# ── 4. FEATURE IMPORTANCE ──────────────────────────────────────────────────
importance = pd.Series(risk_model.feature_importances_, index=FEATURES).sort_values(ascending=False)
print("Top features for risk score:")
print(importance.round(3).to_string(), "\n")

# ── 5. SAVE MODELS ─────────────────────────────────────────────────────────
joblib.dump(risk_model,     'risk_score_model.pkl')
joblib.dump(trust_model,    'trust_score_model.pkl')
joblib.dump(premium_model,  'premium_model.pkl')
joblib.dump(coverage_model, 'coverage_model.pkl')

# Save encoder mappings for inference
encoder_map = {
    'worker_type':   list(le_worker.classes_),
    'location_risk': list(le_location.classes_),
    'features':      FEATURES,
}
with open('encoder_map.json', 'w') as f:
    json.dump(encoder_map, f, indent=2)

print("Saved: risk_score_model.pkl, trust_score_model.pkl, premium_model.pkl, coverage_model.pkl")
print("Saved: encoder_map.json\n")

# ── 6. INFERENCE FUNCTION ──────────────────────────────────────────────────
def predict(input_dict):
    """
    Run inference on a single worker input.

    Example:
        result = predict({
            "worker_type": "food",
            "location_risk": "high",
            "temperature_celsius": 42,
            "rainfall_mm": 120,
            "aqi": 320,
            "curfew_probability": 0.6,
            "zone_closure_probability": 0.3,
            "historical_disruption_score": 70,
            "gps_valid": True,
            "claim_history_score": 80,
            "spoofing_risk": 20
        })
    """
    row = input_dict.copy()
    row['worker_type_enc']   = le_worker.transform([row.pop('worker_type')])[0]
    row['location_risk_enc'] = le_location.transform([row.pop('location_risk')])[0]
    row['gps_valid']         = int(row['gps_valid'])

    X_inf = pd.DataFrame([row])[FEATURES]

    risk_score    = int(risk_model.predict(X_inf).clip(0, 100).round()[0])
    trust_score   = int(trust_model.predict(X_inf).clip(0, 100).round()[0])
    weekly_premium= int(premium_model.predict(X_inf)[0])
    coverage      = int(coverage_model.predict(X_inf)[0])

    return {
        "risk_score":     risk_score,
        "trust_score":    trust_score,
        "weekly_premium": weekly_premium,
        "coverage":       coverage,
    }


# ── 7. QUICK DEMO ──────────────────────────────────────────────────────────
sample = {
    "worker_type": "food",
    "location_risk": "high",
    "temperature_celsius": 42,
    "rainfall_mm": 130,
    "aqi": 340,
    "curfew_probability": 0.7,
    "zone_closure_probability": 0.4,
    "historical_disruption_score": 75,
    "gps_valid": True,
    "claim_history_score": 85,
    "spoofing_risk": 15,
}

print("Sample prediction:")
print(json.dumps(predict(sample), indent=2))
