import pickle
import numpy as np
from feature_engineering import build_feature_vector

# Load model once
with open("ml/model.pkl", "rb") as f:
    model = pickle.load(f)


def predict_gts(input_data: dict):
    features = build_feature_vector(input_data).reshape(1, -1)
    prediction = model.predict(features)[0]

    return round(prediction, 2)