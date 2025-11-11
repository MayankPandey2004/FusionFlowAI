# app/routers/predict.py
from fastapi import APIRouter, Request
import joblib
import pandas as pd
import datetime
import numpy as np
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import LabelEncoder

router = APIRouter()

# ---------------------------
# Load trained models
# ---------------------------
historic_model = joblib.load("app/models/historic_model.pkl")
fused_model = joblib.load("app/models/fused_model.pkl")

# ---------------------------
# Load datasets
# ---------------------------
traffic_df = pd.read_csv("app/data/traffic.csv", parse_dates=["DateTime"])
weather_df = pd.read_csv("app/data/weather.csv", parse_dates=["Date"])

# Normalize weather columns
weather_df.rename(columns={
    "Temperature": "temperature",
    "Humidity": "humidity",
    "WeatherCondition": "condition"
}, inplace=True)

# Encode condition if exists
if "condition" in weather_df.columns:
    le = LabelEncoder()
    weather_df["condition_encoded"] = le.fit_transform(weather_df["condition"].astype(str))
else:
    weather_df["condition_encoded"] = 0


# ---------------------------
# Prediction route
# ---------------------------
@router.post("")
async def predict(request: Request):
    body = await request.json()
    date_str = body.get("date")

    if not date_str:
        return {"error": "Date is required in format YYYY-MM-DD"}

    try:
        date_obj = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        return {"error": "Invalid date format. Use YYYY-MM-DD."}

    # Check if traffic data exists for that date
    actual_day = traffic_df[traffic_df["DateTime"].dt.date == date_obj].copy()
    has_actual = not actual_day.empty

    if has_actual:
        actual_day["hour"] = actual_day["DateTime"].dt.hour

    # Get weather for that date
    weather_day = weather_df[weather_df["Date"] == pd.to_datetime(date_obj)]
    weather_info = weather_day.iloc[0] if not weather_day.empty else None

    results = []
    actuals, hist_preds, fused_preds = [], [], []

    for hour in range(24):
        # --- Historical-only model ---
        X_hist = pd.DataFrame([{
            "hour": hour,
            "dayofweek": date_obj.weekday(),
            "month": date_obj.month
        }])
        hist_pred = float(historic_model.predict(X_hist)[0])

        # --- Fused model (with weather) ---
        X_fused = pd.DataFrame([{
            "hour": hour,
            "dayofweek": date_obj.weekday(),
            "month": date_obj.month,
            "temperature": weather_info["temperature"] if weather_info is not None else 25,
            "humidity": weather_info["humidity"] if weather_info is not None else 55,
            "condition_encoded": weather_info["condition_encoded"] if weather_info is not None else 0
        }])
        fused_pred = float(fused_model.predict(X_fused)[0])

        row = {
            "hour": hour,
            "historical": hist_pred,
            "fused": fused_pred
        }

        # Add actual values if available
        if has_actual and hour in actual_day["DateTime"].dt.hour.values:
            actual_val = float(actual_day.loc[actual_day["hour"] == hour, "Vehicles"].mean())
            row["actual"] = actual_val
            actuals.append(actual_val)
            hist_preds.append(hist_pred)
            fused_preds.append(fused_pred)

        results.append(row)

    # Compute metrics only if actuals exist
    metrics = {}
    if has_actual and actuals:
        hist_rmse = np.sqrt(mean_squared_error(actuals, hist_preds))
        fused_rmse = np.sqrt(mean_squared_error(actuals, fused_preds))
        improvement = ((hist_rmse - fused_rmse) / hist_rmse * 100) if hist_rmse > 0 else 0
        metrics = {
            "historical_rmse": round(hist_rmse, 3),
            "fused_rmse": round(fused_rmse, 3),
            "improvement": round(improvement, 2)
        }

    response = {
        "date": date_str,
        "predictions": results,
    }

    if metrics:
        response["metrics"] = metrics
    else:
        response["metrics"] = None  # keep key but indicate no actual data

    return response
