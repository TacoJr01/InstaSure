import pickle
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

from data_generator import generate_data
from feature_engineering import build_feature_vector

import numpy as np

# Generate dataset
df = generate_data(10000)

X = []
y = []

for _, row in df.iterrows():
    features = build_feature_vector(row)
    X.append(features)
    y.append(row["GTS"])

X = np.array(X)
y = np.array(y)

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = RandomForestRegressor(
    n_estimators=200,
    max_depth=10,
    random_state=42
)

model.fit(X_train, y_train)

# Evaluate
preds = model.predict(X_test)

print("MAE:", mean_absolute_error(y_test, preds))
print("R2:", r2_score(y_test, preds))

# Save model
with open("ml/model.pkl", "wb") as f:
    pickle.dump(model, f)