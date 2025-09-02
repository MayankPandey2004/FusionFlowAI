import pandas as pd
import numpy as np
import joblib
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder

# ---------------------------
# 1. Load datasets
# ---------------------------
traffic_df = pd.read_csv("app/data/traffic.csv", parse_dates=["DateTime"])
weather_df = pd.read_csv("app/data/weather.csv", parse_dates=["Date"])

# Normalize column names just in case
weather_df.rename(columns={
    "Temperature": "temperature",
    "Humidity": "humidity",
    "WeatherCondition": "condition"
}, inplace=True)

# Ensure date formats match
traffic_df["Date"] = traffic_df["DateTime"].dt.date
weather_df["Date"] = pd.to_datetime(weather_df["Date"]).dt.date

# Merge traffic with weather
merged_df = traffic_df.merge(weather_df, on="Date", how="left")

# ---------------------------
# 2. Feature Engineering
# ---------------------------
for df in [traffic_df, merged_df]:
    df["hour"] = df["DateTime"].dt.hour
    df["dayofweek"] = df["DateTime"].dt.dayofweek
    df["month"] = df["DateTime"].dt.month

# Encode weather condition
if "condition" in merged_df.columns:
    le = LabelEncoder()
    merged_df["condition_encoded"] = le.fit_transform(merged_df["condition"].astype(str))
else:
    merged_df["condition_encoded"] = 0

# Fill missing numeric values safely
for col in ["temperature", "humidity"]:
    if col in merged_df.columns:
        merged_df[col] = merged_df[col].fillna(merged_df[col].mean())

# Fill missing encoded conditions with mode
if "condition_encoded" in merged_df.columns:
    merged_df["condition_encoded"] = merged_df["condition_encoded"].fillna(
        merged_df["condition_encoded"].mode()[0]
    )

# ---------------------------
# 3. Historic-only model
# ---------------------------
X_hist = traffic_df[["hour", "dayofweek", "month"]]
y_hist = traffic_df["Vehicles"]

X_train, X_test, y_train, y_test = train_test_split(
    X_hist, y_hist, test_size=0.2, random_state=42
)

hist_model = XGBRegressor(n_estimators=200, learning_rate=0.1, max_depth=6, random_state=42)
hist_model.fit(X_train, y_train)

y_pred_hist = hist_model.predict(X_test)
print("📊 Historic Model R2:", r2_score(y_test, y_pred_hist))
print("📊 Historic Model RMSE:", np.sqrt(mean_squared_error(y_test, y_pred_hist)))

joblib.dump(hist_model, "app/models/historic_model.pkl")

# ---------------------------
# 4. Fused model (with weather)
# ---------------------------
X_fused = merged_df[["hour", "dayofweek", "month", "temperature", "humidity", "condition_encoded"]]
y_fused = merged_df["Vehicles"]

X_train, X_test, y_train, y_test = train_test_split(
    X_fused, y_fused, test_size=0.2, random_state=42
)

fused_model = XGBRegressor(n_estimators=200, learning_rate=0.1, max_depth=6, random_state=42)
fused_model.fit(X_train, y_train)

y_pred_fused = fused_model.predict(X_test)
print("🤖 Fused Model R2:", r2_score(y_test, y_pred_fused))
print("🤖 Fused Model RMSE:", np.sqrt(mean_squared_error(y_test, y_pred_fused)))

joblib.dump(fused_model, "app/models/fused_model.pkl")

print("✅ Models trained and saved successfully!")
