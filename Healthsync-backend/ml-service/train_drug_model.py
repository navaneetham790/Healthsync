"""
Drug Interaction ML Model Trainer
Trains a classifier on drug_interactions.csv
Output: drug_model.pkl
"""

import pandas as pd
import numpy as np
import pickle
import os
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
from scipy.sparse import hstack

# ─── Load Dataset ───────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "drug_interactions.csv")

print(f"[INFO] Loading dataset from: {CSV_PATH}")
df = pd.read_csv(CSV_PATH, keep_default_na=False)
print(f"[INFO] Loaded {len(df)} records")
print(f"[INFO] Columns: {list(df.columns)}")
print(f"[INFO] Severity distribution:\n{df['severity'].value_counts()}\n")

# ─── Clean & Prepare ────────────────────────────────────────────────────────────
df.columns = df.columns.str.strip().str.lower()
df = df.dropna(subset=['drug1', 'drug2', 'severity'])

# Normalize drug names
df['drug1'] = df['drug1'].str.strip().str.lower()
df['drug2'] = df['drug2'].str.strip().str.lower()

# Create combined text feature — drug pair (both orders)
df['pair_text'] = df['drug1'] + " " + df['drug2']
df['pair_text_rev'] = df['drug2'] + " " + df['drug1']

# Encode labels
le = LabelEncoder()
df['label'] = le.fit_transform(df['severity'])  # Major=0, Minor=1, Moderate=2, None=3 (alphabetical)

print(f"[INFO] Label mapping: {dict(zip(le.classes_, le.transform(le.classes_)))}")

X = df['pair_text'].values
y = df['label'].values

# ─── Train/Test Split ────────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"[INFO] Train: {len(X_train)}, Test: {len(X_test)}")

# ─── Build Pipeline ─────────────────────────────────────────────────────────────
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        ngram_range=(1, 2),
        analyzer='char_wb',
        min_df=1,
        max_features=5000
    )),
    ('clf', RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        random_state=42,
        class_weight='balanced',
        n_jobs=-1
    ))
])

# ─── Train ──────────────────────────────────────────────────────────────────────
print("[INFO] Training model...")
pipeline.fit(X_train, y_train)

# ─── Evaluate ───────────────────────────────────────────────────────────────────
y_pred = pipeline.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"\n[RESULT] Accuracy: {acc*100:.1f}%")
print(f"\n[RESULT] Classification Report:")
print(classification_report(y_test, y_pred, target_names=le.classes_))

# ─── Save Model ─────────────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(BASE_DIR, "drug_model.pkl")
with open(MODEL_PATH, "wb") as f:
    pickle.dump({
        'pipeline': pipeline,
        'label_encoder': le,
        'classes': list(le.classes_),
        'features': ['drug1', 'drug2'],
        'accuracy': acc
    }, f)

print(f"\n[OK] Model saved to: {MODEL_PATH}")
print(f"[OK] Classes: {list(le.classes_)}")
print(f"[OK] Accuracy: {acc*100:.1f}%")

# ─── Quick Test ─────────────────────────────────────────────────────────────────
def predict_interaction(drug1, drug2):
    text = f"{drug1.lower()} {drug2.lower()}"
    pred_label = pipeline.predict([text])[0]
    proba = pipeline.predict_proba([text])[0]
    severity = le.inverse_transform([pred_label])[0]
    confidence = float(max(proba)) * 100
    return severity, confidence

print("\n[TEST] Quick predictions:")
tests = [
    ("warfarin", "aspirin"),
    ("paracetamol", "cetirizine"),
    ("metformin", "amlodipine"),
    ("aspirin", "ibuprofen"),
    ("warfarin", "ibuprofen"),
]
for d1, d2 in tests:
    sev, conf = predict_interaction(d1, d2)
    print(f"  {d1} + {d2} -> {sev} ({conf:.1f}% confidence)")

print("\n[DONE] Drug interaction model training complete!")
