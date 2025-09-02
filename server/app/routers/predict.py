# app/routers/predict.py
from fastapi import APIRouter, Request
import joblib
import pandas as pd
import datetime
from sklearn.metrics import mean_squared_error
import numpy as np

router = APIRouter()

# Load trained models
historic_model = joblib.load("app/models/historic_model.pkl")
fused_model = joblib.load("app/models/fused_model.pkl")

# Load datasets
traffic_df = pd.read_csv("app/data/traffic.csv", parse_dates=["DateTime"])
weather_df = pd.read_csv("app/data/weather.csv", parse_dates=["Date"])

# Ensure weather columns are normalized
weather_df.rename(columns={
    "Temperature": "temperature",
    "Humidity": "humidity",
    "WeatherCondition": "condition"
}, inplace=True)

# Encode condition if exists
if "condition" in weather_df.columns:
    from sklearn.preprocessing import LabelEncoder
    le = LabelEncoder()
    weather_df["condition_encoded"] = le.fit_transform(weather_df["condition"].astype(str))
else:
    weather_df["condition_encoded"] = 0


@router.post("")
async def predict(request: Request):
    body = await request.json()
    date_str = body.get("date")
    if not date_str:
        return {"error": "Date is required"}

    try:
        date_obj = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        return {"error": "Invalid date format. Use YYYY-MM-DD."}

    # Filter actual traffic for this date
    actual_day = traffic_df[traffic_df["DateTime"].dt.date == date_obj].copy()
    if actual_day.empty:
        return {"error": f"No traffic data available for {date_str}"}

    actual_day["hour"] = actual_day["DateTime"].dt.hour

    # Get weather info for this date
    weather_day = weather_df[weather_df["Date"] == pd.to_datetime(date_obj)]
    weather_info = None
    if not weather_day.empty:
        weather_info = weather_day.iloc[0]

    results = []
    actuals, hist_preds, fused_preds = [], [], []

    for hour in range(24):
        # Historic features
        features_hist = pd.DataFrame([{
            "hour": hour,
            "dayofweek": date_obj.weekday(),
            "month": date_obj.month
        }])
        hist_pred = float(historic_model.predict(features_hist)[0])

        # Fused features
        features_fused = pd.DataFrame([{
            "hour": hour,
            "dayofweek": date_obj.weekday(),
            "month": date_obj.month,
            "temperature": weather_info["temperature"] if weather_info is not None else 20,
            "humidity": weather_info["humidity"] if weather_info is not None else 50,
            "condition_encoded": weather_info["condition_encoded"] if weather_info is not None else 0
        }])
        fused_pred = float(fused_model.predict(features_fused)[0])

        # Actual (if exists)
        actual = None
        if hour in actual_day["hour"].values:
            actual = float(actual_day[actual_day["hour"] == hour]["Vehicles"].mean())

        results.append({
            "hour": hour,
            "actual": actual,
            "historical": hist_pred,
            "fused": fused_pred
        })

        if actual is not None:
            actuals.append(actual)
            hist_preds.append(hist_pred)
            fused_preds.append(fused_pred)

    # 📊 Metrics
    metrics = {}
    if actuals:
        hist_rmse = np.sqrt(mean_squared_error(actuals, hist_preds))
        fused_rmse = np.sqrt(mean_squared_error(actuals, fused_preds))
        improvement = ((hist_rmse - fused_rmse) / hist_rmse * 100) if hist_rmse > 0 else 0
        metrics = {
            "historical_rmse": hist_rmse,
            "fused_rmse": fused_rmse,
            "improvement": improvement
        }

    return {
        "date": date_str,
        "predictions": results,
        "metrics": metrics
    }
