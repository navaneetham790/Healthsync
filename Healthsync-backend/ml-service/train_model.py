import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

print("=" * 50)
print("  HealthSync AI Risk Prediction - Model Trainer")
print("=" * 50)

# ---- Load Dataset ----
csv_path = "heart.csv"
if not os.path.exists(csv_path):
    print(f"\n[ERROR] '{csv_path}' not found!")
    print("Please download heart.csv from Kaggle and place it in this folder.")
    exit(1)

df = pd.read_csv(csv_path)
print(f"\n[OK] Dataset loaded: {len(df)} rows, {len(df.columns)} columns")
print(f"     Columns: {list(df.columns)}")

# ---- Create Risk Level from target column ----
# Heart Disease dataset: target=1 means disease, 0 means no disease
# We map it to LOW / MEDIUM / HIGH based on multiple features

def assign_risk(row):
    score = 0
    # Age risk
    if row.get('age', 0) >= 55:
        score += 2
    elif row.get('age', 0) >= 45:
        score += 1

    # Blood pressure risk (trestbps)
    bp = row.get('trestbps', 120)
    if bp >= 140:
        score += 2
    elif bp >= 130:
        score += 1

    # Blood sugar risk (fbs = 1 if fasting blood sugar > 120 mg/dl)
    if row.get('fbs', 0) == 1:
        score += 2

    # Cholesterol risk
    chol = row.get('chol', 200)
    if chol >= 240:
        score += 2
    elif chol >= 200:
        score += 1

    # Target (disease present)
    if row.get('target', 0) == 1:
        score += 3

    # Map score to risk level
    if score >= 6:
        return 'HIGH'
    elif score >= 3:
        return 'MEDIUM'
    else:
        return 'LOW'

df['risk_level'] = df.apply(assign_risk, axis=1)
print(f"\n[OK] Risk levels assigned:")
print(df['risk_level'].value_counts().to_string())

# ---- Select Features ----
feature_cols = ['age', 'trestbps', 'chol', 'fbs', 'thalach']
# Only use columns that exist in the dataset
feature_cols = [c for c in feature_cols if c in df.columns]
print(f"\n[OK] Features used: {feature_cols}")

X = df[feature_cols].fillna(0)
y = df['risk_level']

# ---- Train / Test Split ----
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\n[OK] Training samples: {len(X_train)}, Test samples: {len(X_test)}")

# ---- Train Model ----
print("\n[...] Training RandomForest model...")
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=8,
    random_state=42,
    class_weight='balanced'
)
model.fit(X_train, y_train)

# ---- Evaluate ----
y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"\n[OK] Model Accuracy: {acc * 100:.2f}%")
print("\n[OK] Classification Report:")
print(classification_report(y_test, y_pred))

# ---- Save Model & Feature List ----
joblib.dump(model, "model.pkl")
joblib.dump(feature_cols, "features.pkl")
print("\n[OK] model.pkl saved!")
print("[OK] features.pkl saved!")
print("\n" + "=" * 50)
print("  Training Complete! Run: python app.py")
print("=" * 50)
