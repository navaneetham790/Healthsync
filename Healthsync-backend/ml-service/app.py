from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
import re
import pickle
import csv
from dotenv import load_dotenv
import google.generativeai as genai
import PIL.Image

load_dotenv()
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_KEY and GEMINI_KEY != "your_api_key_here":
    genai.configure(api_key=GEMINI_KEY)
else:
    print("[WARN] GEMINI_API_KEY not set or invalid in .env")

app = Flask(__name__)
CORS(app)  # Allow requests from React frontend

# ---- Load Risk Model ----
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model.pkl")
FEATURES_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "features.pkl")

# The hospital directory and drug-interaction checker must remain available
# even when the optional risk-model dependencies are not installed locally.
model = None
feature_cols = []
try:
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("model.pkl not found")
    model = joblib.load(MODEL_PATH)
    feature_cols = joblib.load(FEATURES_PATH)
    print(f"[OK] Risk Model loaded. Features: {feature_cols}")
except Exception as error:
    print(f"[WARN] Risk model unavailable: {error}")

HOSPITAL_CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "datasets", "Hospitals.csv")
hospital_records = []

def load_hospitals():
    global hospital_records
    try:
        with open(HOSPITAL_CSV_PATH, mode="r", encoding="utf-8-sig", newline="") as csv_file:
            hospital_records = [{"hospital": (row.get("Hospital") or "").strip(), "localAddress": (row.get("LocalAddress") or "").strip(), "city": (row.get("City") or "").strip(), "state": (row.get("State") or "").strip(), "pincode": (row.get("Pincode") or "").strip()} for row in csv.DictReader(csv_file) if (row.get("Hospital") or "").strip()]
        print(f"[OK] Loaded {len(hospital_records)} hospitals from dataset.")
    except Exception as error:
        hospital_records = []
        print(f"[WARN] Failed to load hospital dataset: {error}")

load_hospitals()

# ---- Load Drug Interaction Model & Database ----
DRUG_MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "drug_model.pkl")
DRUG_CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "drug_interactions.csv")

drug_pipeline = None
drug_encoder = None
known_interactions = {}  # key: tuple(sorted([d1, d2])), val: (severity, effect)

# Load database for exact lookups
if os.path.exists(DRUG_CSV_PATH):
    try:
        import pandas as pd
        df_ddi = pd.read_csv(DRUG_CSV_PATH, keep_default_na=False)
        for _, row in df_ddi.iterrows():
            d1_clean = row['drug1'].strip().lower()
            d2_clean = row['drug2'].strip().lower()
            key = tuple(sorted([d1_clean, d2_clean]))
            known_interactions[key] = (row['severity'], row['effect'])
        print(f"[OK] Loaded {len(known_interactions)} known drug interactions from CSV.")
    except Exception as e:
        print(f"[WARN] Failed to load known drug interactions CSV: {e}")

# Load ML model
if os.path.exists(DRUG_MODEL_PATH):
    try:
        with open(DRUG_MODEL_PATH, "rb") as f:
            mdata = pickle.load(f)
            drug_pipeline = mdata['pipeline']
            drug_encoder = mdata['label_encoder']
            print(f"[OK] Drug Interaction ML Model loaded. Accuracy: {mdata.get('accuracy', 0)*100:.1f}%")
    except Exception as e:
        print(f"[WARN] Failed to load drug interaction model: {e}")

# ---- Risk Advice ----
ADVICE = {
    "LOW": [
        "Maintain regular exercise and a balanced diet.",
        "Schedule routine annual health checkups.",
        "Continue prescribed medicines, if any."
    ],
    "MEDIUM": [
        "Book a follow-up consultation within 30 days.",
        "Monitor blood pressure and blood sugar regularly.",
        "Follow a doctor-approved diet and activity plan."
    ],
    "HIGH": [
        "Arrange a doctor consultation as soon as possible.",
        "Monitor symptoms and vital signs closely.",
        "Do not stop or change medication without medical advice."
    ]
}

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok", 
        "service": "HealthSync ML Service", 
        "port": 8084,
        "drugModelLoaded": drug_pipeline is not None
    })

@app.route("/hospitals", methods=["GET"])
def hospitals():
    return jsonify(hospital_records)

import json
@app.route("/extract-report", methods=["POST"])
def extract_report():
    try:
        if not GEMINI_KEY or GEMINI_KEY == "your_api_key_here":
            return jsonify({"error": "Gemini API key is missing or invalid in .env file."}), 500
            
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        # Read image
        img = PIL.Image.open(file.stream)
        
        # Configure Gemini Model
        model = genai.GenerativeModel('gemini-3.6-flash')
        
        prompt = """
        You are an expert clinical AI assistant. Analyze the provided lab report image.
        1. First, verify if this is actually a medical report (like a blood test, lipid profile, CBC).
        2. If it is NOT a medical report (e.g. a leetcode badge, a random photo), return EXACTLY the JSON: {"error": "Invalid Document - Please upload a valid Lab Report."} and nothing else.
        3. If it IS a medical report, extract all visible clinical parameters (Blood Pressure, Sugar, BMI, Cholesterol, Liver Enzymes, etc).
        4. Provide an overall analysis and calculate risk levels.
        
        Return a strict JSON object with this EXACT structure (no markdown tags, just raw JSON):
        {
          "isValid": true,
          "extractedData": {
             "bloodPressure": "extracted or default 120/80",
             "bloodSugar": "extracted or default 100",
             "bmi": "extracted or default 24.5",
             "smoker": "yes or no (infer if possible, else no)",
             "conditions": "any conditions inferred from the report"
          },
          "comprehensiveAnalysis": {
             "riskLevel": "LOW, MEDIUM, or HIGH",
             "confidence": "percentage integer (e.g. 95)",
             "multiDiseaseRisks": [
                {"disease": "...", "riskScore": integer_0_to_100, "level": "low/medium/high"},
                ... up to 4 top risks
             ],
             "featureImportance": [
                {"feature": "...", "contribution": integer, "impact": "positive or negative"},
                ... up to 5 top features
             ]
          }
        }
        """
        
        response = model.generate_content([prompt, img])
        response_text = response.text.strip()
        
        # Clean potential markdown JSON formatting
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
            
        result = json.loads(response_text)
        
        if "error" in result:
            return jsonify(result), 400
            
        return jsonify(result)
        
    except Exception as e:
        print("Gemini Extraction Error:", e)
        return jsonify({"error": "Failed to process image: " + str(e)}), 500


@app.route("/predict", methods=["POST"])
def predict():
    try:
        if model is None:
            return jsonify({"error": "Risk prediction model is not available on this server."}), 503
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Extract features from request
        age = float(data.get("age", 30))
        bp_str = str(data.get("bloodPressure", "120/80"))
        systolic = float(bp_str.split("/")[0]) if "/" in bp_str else float(bp_str)
        blood_sugar = float(data.get("bloodSugar", 90))
        bmi = float(data.get("bmi", 22))
        smoker = 1 if str(data.get("smoker", "no")).lower() == "yes" else 0
        conditions = str(data.get("conditions", ""))

        # Map to dataset features
        fbs = 1 if blood_sugar > 120 else 0
        thalach = max(60, 220 - age - (10 if smoker else 0))  # estimated max heart rate
        chol = 200 + (20 if fbs else 0) + (15 if smoker else 0)  # estimated cholesterol

        feature_map = {
            "age": age,
            "trestbps": systolic,
            "chol": chol,
            "fbs": fbs,
            "thalach": thalach
        }

        # Build input array in correct feature order
        input_data = np.array([[feature_map.get(f, 0) for f in feature_cols]])

        # Predict
        prediction = model.predict(input_data)[0]
        probabilities = model.predict_proba(input_data)[0]
        confidence = round(float(max(probabilities)) * 100, 1)

        # Boost to HIGH if serious conditions present
        serious = ["diabetes", "hypertension", "heart", "cancer", "kidney"]
        if any(s in conditions.lower() for s in serious):
            if prediction == "LOW":
                prediction = "MEDIUM"
            elif prediction == "MEDIUM":
                prediction = "HIGH"

        # --- Advanced AI Dashboard Features (Heuristics for Research Mockup) ---
        multi_disease_risks = []
        
        # Cardiovascular Risk
        cvd_score = min(95, max(5, (age / 100 * 30) + ((systolic - 120) / 100 * 40) + (smoker * 20) + ((bmi - 25) / 20 * 10)))
        multi_disease_risks.append({"disease": "Cardiovascular Risk", "riskScore": round(cvd_score)})
        
        # Type 2 Diabetes
        diab_score = min(95, max(5, ((blood_sugar - 100) / 100 * 50) + ((bmi - 25) / 15 * 30) + (age / 100 * 20)))
        multi_disease_risks.append({"disease": "Type 2 Diabetes", "riskScore": round(diab_score)})
        
        # Chronic Kidney Disease (CKD)
        ckd_score = min(95, max(5, ((systolic - 120) / 100 * 30) + ((blood_sugar - 100) / 100 * 30) + (age / 100 * 40)))
        multi_disease_risks.append({"disease": "Chronic Kidney Disease", "riskScore": round(ckd_score)})
        
        # Stroke Risk
        stroke_score = min(95, max(5, ((systolic - 120) / 100 * 45) + (age / 100 * 35) + (smoker * 20)))
        multi_disease_risks.append({"disease": "Stroke Risk", "riskScore": round(stroke_score)})
        
        # Respiratory Risk
        resp_score = min(95, max(5, (smoker * 60) + (20 if 'asthma' in conditions.lower() else 0) + (age / 100 * 20)))
        if smoker == 1 or 'asthma' in conditions.lower() or 'copd' in conditions.lower():
            multi_disease_risks.append({"disease": "Respiratory Risk", "riskScore": round(resp_score)})
        
        # Liver Disease
        liver_score = min(95, max(5, ((bmi - 25) / 15 * 50) + ((blood_sugar - 100) / 100 * 30)))
        if bmi > 28 or blood_sugar > 110:
            multi_disease_risks.append({"disease": "Fatty Liver Risk", "riskScore": round(liver_score)})

        # Sort and pick top 4
        multi_disease_risks.sort(key=lambda x: x["riskScore"], reverse=True)
        top_risks = multi_disease_risks[:4]
        
        for r in top_risks:
            if r["riskScore"] >= 65:
                r["level"] = "high"
            elif r["riskScore"] >= 35:
                r["level"] = "medium"
            else:
                r["level"] = "low"

        # Feature Importance (Explainable AI SHAP mock)
        feature_importance = []
        if systolic > 130:
            feature_importance.append({"feature": f"High BP ({systolic})", "contribution": round((systolic-120)/2), "impact": "positive"})
        if blood_sugar > 110:
            feature_importance.append({"feature": f"Elevated Sugar ({blood_sugar})", "contribution": round((blood_sugar-100)/3), "impact": "positive"})
        if smoker == 1:
            feature_importance.append({"feature": "Smoking Habit", "contribution": 20, "impact": "positive"})
        if bmi > 27:
            feature_importance.append({"feature": f"High BMI ({bmi})", "contribution": round((bmi-25)*2), "impact": "positive"})
        
        if age < 40:
            feature_importance.append({"feature": f"Young Age ({age})", "contribution": 10, "impact": "negative"})
        elif age > 60:
            feature_importance.append({"feature": f"Advanced Age ({age})", "contribution": 15, "impact": "positive"})
            
        if 18.5 <= bmi <= 24.9:
            feature_importance.append({"feature": f"Normal BMI ({bmi})", "contribution": 8, "impact": "negative"})
            
        if smoker == 0:
            feature_importance.append({"feature": "Non-smoker", "contribution": 5, "impact": "negative"})
            
        if systolic <= 120:
             feature_importance.append({"feature": f"Normal BP ({systolic})", "contribution": 10, "impact": "negative"})
             
        # sort by absolute contribution
        feature_importance.sort(key=lambda x: x["contribution"], reverse=True)
        top_features = feature_importance[:5]


        return jsonify({
            "riskLevel": prediction,
            "confidence": confidence,
            "advice": ADVICE.get(prediction, []),
            "inputSummary": {
                "age": age,
                "bloodPressure": bp_str,
                "bloodSugar": blood_sugar,
                "bmi": bmi,
                "smoker": data.get("smoker", "no"),
                "conditions": conditions
            },
            "multiDiseaseRisks": top_risks,
            "featureImportance": top_features
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict/worker/<worker_id>", methods=["GET"])
def predict_worker(worker_id):
    return jsonify({
        "workerId": worker_id,
        "riskLevel": "MEDIUM",
        "confidence": 72.5,
        "advice": ADVICE["MEDIUM"],
        "lastAssessed": "2026-08-08"
    })

@app.route("/drug-interaction", methods=["POST"])
def check_drug_interaction():
    try:
        data = request.json
        if not data or "medicines" not in data:
            return jsonify({"error": "No medicines list provided"}), 400
        
        medicines = [m.strip() for m in data["medicines"] if m.strip()]
        if len(medicines) < 2:
            return jsonify({"error": "At least two medicines are required"}), 400
        
        def clean_drug_name(name):
            name = name.lower()
            name = re.sub(r'\d+\s*(?:mg|g|mcg|ml)\b', '', name)
            return re.sub(r'[^a-z0-9]', ' ', name).strip()

        interactions = []
        for i in range(len(medicines)):
            for j in range(i + 1, len(medicines)):
                m1, m2 = medicines[i], medicines[j]
                m1_clean = clean_drug_name(m1)
                m2_clean = clean_drug_name(m2)
                
                key = tuple(sorted([m1_clean, m2_clean]))
                
                if key in known_interactions:
                    severity, effect = known_interactions[key]
                    confidence = 100.0
                    method = "Database lookup"
                elif drug_pipeline and drug_encoder:
                    text = f"{m1_clean} {m2_clean}"
                    pred_label = drug_pipeline.predict([text])[0]
                    proba = drug_pipeline.predict_proba([text])[0]
                    severity = drug_encoder.inverse_transform([pred_label])[0]
                    confidence = round(float(max(proba)) * 100, 1)
                    method = "AI Prediction"
                    
                    if severity == "None":
                        effect = "No significant interaction known."
                    elif severity == "Major":
                        effect = f"Potential Major interaction. Combined use of {m1} and {m2} poses serious clinical risks. Monitor patient closely."
                    elif severity == "Moderate":
                        effect = f"Potential Moderate interaction. Combined use of {m1} and {m2} may require monitoring or dosage adjustment."
                    else:
                        effect = f"Potential Minor interaction. Combined use of {m1} and {m2} may have minor side effects."
                else:
                    severity = "None"
                    effect = "No significant interaction known."
                    confidence = 100.0
                    method = "Fallback"
                
                interactions.append({
                    "pair": f"{m1} + {m2}",
                    "severity": severity,
                    "effect": effect,
                    "confidence": confidence,
                    "method": method
                })
        
        order = {"Major": 0, "Moderate": 1, "Minor": 2, "None": 3}
        interactions.sort(key=lambda x: order.get(x["severity"], 4))
        
        return jsonify({
            "medicines": medicines,
            "interactions": interactions
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("  HealthSync ML Service starting on port 8084")
    print("  POST /predict            — Risk prediction")
    print("  POST /drug-interaction   — Drug interaction check (AI + DB)")
    print("  GET  /health             — Health check")
    print("=" * 50 + "\n")
    app.run(host="127.0.0.1", port=8084, debug=False, threaded=True)
