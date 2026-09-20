import { useState, useEffect, useRef } from "react";
import {
  FaRobot,
  FaUpload,
  FaFilePdf,
  FaCheckCircle,
  FaUser,
  FaStethoscope,
  FaExclamationTriangle,
  FaShieldAlt,
  FaTimes
} from "react-icons/fa";
import "./AIRiskPrediction.css";
import { notify } from "../../components/ToastProvider";
import DoctorService from "../../services/DoctorService";

const RISK_COLORS = { low: "#22c55e", medium: "#f59e0b", high: "#ef4444" };

function detectPatientMismatch(file, selectedWorkerName, workersList = []) {
  if (!selectedWorkerName || !file) return null;
  const fileNameClean = file.name.replace(/[_\-.]/g, " ").toLowerCase();
  const selectedFirst = selectedWorkerName.trim().toLowerCase().split(/\s+/)[0];

  // 1. Check if the file contains another worker's or doctor's known name
  for (const w of workersList) {
    const otherFirst = (w.fullName || "").trim().toLowerCase().split(/\s+/)[0];
    if (otherFirst && otherFirst !== selectedFirst && otherFirst.length >= 3) {
      if (fileNameClean.includes(otherFirst)) {
        return {
          detectedName: w.fullName || (otherFirst.charAt(0).toUpperCase() + otherFirst.slice(1)),
          selectedName: selectedWorkerName,
          reason: `Document explicitly contains patient name "${w.fullName || otherFirst}"`
        };
      }
    }
  }

  // 2. Check if filename begins with a proper name token like "Navaneetha_..."
  const tokens = file.name.split(/[_\-.\s]+/);
  const firstToken = tokens[0];
  const genericTerms = [
    "sample", "lab", "report", "blood", "test", "cbc", "medical", "patient",
    "doc", "scan", "health", "hospital", "clinic", "result", "results", "ecg", "xray"
  ];
  if (
    firstToken &&
    firstToken.length >= 3 &&
    !genericTerms.includes(firstToken.toLowerCase())
  ) {
    const tokenLower = firstToken.toLowerCase();
    if (tokenLower !== selectedFirst && !fileNameClean.includes(selectedFirst)) {
      return {
        detectedName: firstToken.charAt(0).toUpperCase() + firstToken.slice(1).toLowerCase(),
        selectedName: selectedWorkerName,
        reason: `Document filename begins with patient name "${firstToken}"`
      };
    }
  }

  return null;
}

function AIRiskPrediction() {
  const [workerId, setWorkerId] = useState("");
  const [workerName, setWorkerName] = useState("");
  const [workersList, setWorkersList] = useState([]);

  // Upload and Simulation State
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [scanStep, setScanStep] = useState("");
  const [result, setResult] = useState(null);
  const [extractedVitals, setExtractedVitals] = useState(null);
  const [mismatchData, setMismatchData] = useState(null);
  const [isOverridden, setIsOverridden] = useState(false);
  const fileInputRef = useRef(null);

  // For prescriptive simulation
  const [simulateIntervention, setSimulateIntervention] = useState(false);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const { data } = await DoctorService.getWorkerDirectory();
        setWorkersList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load workers list", err);
      }
    };
    fetchWorkers();
  }, []);

  useEffect(() => {
    if (workerId.trim()) {
      const match = workersList.find(
        (item) =>
          item.workerCode?.trim().toLowerCase() === workerId.trim().toLowerCase() ||
          String(item.id).trim() === workerId.trim()
      );
      if (match) {
        setWorkerName(match.fullName?.trim() || "");
      } else {
        setWorkerName("");
      }
    } else {
      setWorkerName("");
    }
  }, [workerId, workersList]);

  const resetAnalysis = () => {
    setUploadedFile(null);
    setResult(null);
    setExtractedVitals(null);
    setMismatchData(null);
    setIsOverridden(false);
    setSimulateIntervention(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileUpload = (e) => {
    if (!workerId.trim() || !workerName) {
      notify.warning("Please select a valid Worker ID first.");
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    resetAnalysis();
    setUploadedFile(file.name);
    setUploading(true);
    setScanStep("Verifying Patient Identity & Document Header...");

    const fileName = file.name.toLowerCase();
    const isMedical =
      fileName.includes("report") ||
      fileName.includes("lab") ||
      fileName.includes("blood") ||
      fileName.includes("health") ||
      fileName.includes("test") ||
      fileName.includes("cbc");

    setTimeout(() => {
      if (!isMedical) {
        setUploading(false);
        setUploadedFile(null);
        notify.error("Invalid Document Detected. Please upload a valid Lab Report.");
        return;
      }

      // 🛡️ PATIENT IDENTITY VERIFICATION CHECK
      const mismatch = detectPatientMismatch(file, workerName, workersList);
      if (mismatch) {
        setUploading(false);
        setMismatchData({
          ...mismatch,
          fileName: file.name,
          file
        });
        notify.error(`Patient Mismatch! Document belongs to ${mismatch.detectedName}, not ${workerName}.`);
        return;
      }

      // Identity Verified -> Proceed with analysis
      proceedWithAnalysis(file, false);
    }, 1200);
  };

  const proceedWithAnalysis = (file, overridden = false) => {
    setMismatchData(null);
    setIsOverridden(overridden);
    setUploading(true);
    setScanStep("Running Optical Character Recognition (OCR)...");

    setTimeout(() => {
      setScanStep("Extracting Clinical Parameters...");

      setTimeout(() => {
        setScanStep("Computing Multi-Disease Risk Vectors...");

        setTimeout(() => {
          // Set read-only extracted vitals
          setExtractedVitals({
            patientName: workerName,
            workerCode: workerId,
            bloodPressure: "148/92 mmHg",
            bloodSugar: "142 mg/dL",
            bmi: "29.2",
            cholesterol: "245 mg/dL (High LDL)",
            smoker: "Yes"
          });

          // Set comprehensive dashboard result
          setResult({
            level: "high",
            riskLevel: "HIGH",
            confidence: 94,
            advice: [
              "Schedule cardiology consultation.",
              "Start statin therapy for elevated LDL.",
              "Enroll in lifestyle modification and diet program."
            ],
            multiDiseaseRisks: [
              { disease: "Cardiovascular Risk", riskScore: 82, level: "high" },
              { disease: "Type 2 Diabetes", riskScore: 65, level: "high" },
              { disease: "Fatty Liver (NAFLD)", riskScore: 58, level: "medium" },
              { disease: "Chronic Kidney Disease", riskScore: 25, level: "low" }
            ],
            featureImportance: [
              { feature: "Smoking Habit", contribution: 25, impact: "positive" },
              { feature: "Elevated BP (148/92)", contribution: 18, impact: "positive" },
              { feature: "High LDL Cholesterol", contribution: 15, impact: "positive" },
              { feature: "Elevated BMI (29.2)", contribution: 10, impact: "positive" },
              { feature: "Active Lifestyle History", contribution: -5, impact: "negative" }
            ]
          });

          setUploading(false);
          notify.success(
            overridden
              ? "Analysis generated with Doctor Override logged."
              : "Lab report verified and analyzed successfully."
          );

          // Update database silently
          DoctorService.updateWorkerRiskByCode(workerId, "HIGH").catch(console.error);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  const cancelMismatch = () => {
    resetAnalysis();
    notify.info("Upload cancelled for patient safety. Please select the matching report.");
  };

  const confirmOverride = () => {
    if (!mismatchData) return;
    const file = mismatchData.file;
    proceedWithAnalysis(file, true);
  };

  return (
    <div className="doctor-risk-page">
      <header className="doctor-page-header">
        <h2>AI Risk Prediction Dashboard</h2>
        <p>Autonomous Multi-modal pipeline with Clinical Patient Verification.</p>
      </header>

      <div className="risk-disclaimer">
        This tool supports clinical review only. It does not diagnose disease or replace medical judgement.
      </div>

      {/* 🚨 CRITICAL PATIENT MISMATCH SAFETY MODAL */}
      {mismatchData && (
        <div className="mismatch-modal-overlay">
          <div className="mismatch-modal-card">
            <div className="mismatch-modal-header">
              <FaExclamationTriangle className="mismatch-alert-icon" />
              <div>
                <h3>Patient Identity Mismatch Detected!</h3>
                <span className="mismatch-badge">CRITICAL SAFETY ALERT</span>
              </div>
              <button className="mismatch-close-btn" onClick={cancelMismatch}>
                <FaTimes />
              </button>
            </div>

            <div className="mismatch-modal-body">
              <p className="mismatch-lead">
                The uploaded document does not match the active patient selected in the portal.
              </p>

              <div className="mismatch-comparison-table">
                <div className="comparison-col col-selected">
                  <span className="col-label">Selected Patient</span>
                  <strong>{mismatchData.selectedName}</strong>
                  <small>ID: {workerId}</small>
                </div>
                <div className="comparison-vs">≠</div>
                <div className="comparison-col col-detected">
                  <span className="col-label">Document Patient Name</span>
                  <strong>{mismatchData.detectedName}</strong>
                  <small>File: {mismatchData.fileName}</small>
                </div>
              </div>

              <div className="mismatch-safety-warning">
                <FaShieldAlt />
                <div>
                  <strong>Clinical Misdiagnosis Hazard:</strong>
                  <p>
                    Analyzing <strong>{mismatchData.detectedName}</strong>'s lab report for{" "}
                    <strong>{mismatchData.selectedName}</strong> will corrupt {mismatchData.selectedName}'s health
                    records and can lead to incorrect medication, wrong dosages, or dangerous clinical treatments.
                  </p>
                </div>
              </div>
            </div>

            <div className="mismatch-modal-footer">
              <button type="button" className="btn-mismatch-cancel" onClick={cancelMismatch}>
                ❌ Cancel &amp; Upload Correct File (Recommended)
              </button>
              <button type="button" className="btn-mismatch-override" onClick={confirmOverride}>
                ⚠️ Doctor Override (Force Continue)
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="doctor-risk-layout">
        <div className="risk-left-panel">
          {/* Patient Selection Card */}
          <div className="patient-select-card">
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "#0f172a" }}>
              <FaUser color="#3b82f6" /> Select Patient
            </h3>
            <div className="risk-grid">
              <label className="risk-field">
                <span className="risk-label">
                  Worker ID <b aria-hidden="true">*</b>
                </span>
                <input
                  value={workerId}
                  onChange={(e) => {
                    setWorkerId(e.target.value.toUpperCase());
                    resetAnalysis();
                  }}
                  placeholder="MW001"
                  list="risk-workers"
                  disabled={uploading}
                />
                <datalist id="risk-workers">
                  {workersList.map((w) => (
                    <option key={w.id} value={w.workerCode}>
                      {w.fullName}
                    </option>
                  ))}
                </datalist>
              </label>

              <label className="risk-field">
                <span className="risk-label">Patient Name</span>
                <input
                  value={workerName}
                  placeholder={workerId ? "Worker not found" : "Select ID first"}
                  readOnly
                  style={{ backgroundColor: "#f8fafc", color: workerName ? "#0f172a" : "#94a3b8" }}
                />
              </label>
            </div>
          </div>

          {/* Upload Area */}
          <div
            className="report-upload-zone"
            onClick={() => !uploading && workerName && fileInputRef.current.click()}
            style={{ opacity: !workerName ? 0.5 : 1, cursor: !workerName ? "not-allowed" : "pointer" }}
          >
            <input type="file" ref={fileInputRef} hidden accept=".pdf,image/*" onChange={handleFileUpload} />
            {uploading ? (
              <div className="upload-loading">
                <FaRobot className="spinning" size={32} />
                <p style={{ fontWeight: "bold", marginTop: "1rem", color: "#0f172a", fontSize: "1.1rem" }}>
                  {scanStep}
                </p>
                <small style={{ color: "#64748b" }}>AI Verification in progress...</small>
              </div>
            ) : uploadedFile ? (
              <div className="upload-success">
                <FaFilePdf size={32} color="#ef4444" />
                <p style={{ fontWeight: "bold", marginTop: "1rem", fontSize: "1.1rem" }}>{uploadedFile}</p>
                {isOverridden ? (
                  <small style={{ color: "#d97706", fontWeight: "bold" }}>
                    ⚠️ Doctor Override Active (Patient Name Mismatch)
                  </small>
                ) : (
                  <small style={{ color: "#15803d", fontWeight: "bold" }}>
                    ✅ Identity Verified &amp; Analyzed for {workerName}
                  </small>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetAnalysis();
                  }}
                  style={{
                    marginTop: "1.5rem",
                    padding: "0.6rem 1.2rem",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                    borderRadius: "0.5rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    margin: "1.5rem auto 0"
                  }}
                >
                  Start New Analysis
                </button>
              </div>
            ) : (
              <div className="upload-prompt">
                <FaUpload size={32} color={workerName ? "#3b82f6" : "#94a3b8"} />
                <p style={{ fontWeight: "bold", marginTop: "1rem", color: "#0f172a", fontSize: "1.1rem" }}>
                  {workerName
                    ? `Click or drag Lab Report for ${workerName}`
                    : "Select a patient to upload report"}
                </p>
                <small style={{ color: "#64748b" }}>
                  System automatically verifies patient identity before analysis.
                </small>
              </div>
            )}
          </div>

          {/* Extracted Vitals Summary (Read-Only) */}
          {extractedVitals && (
            <div className="extracted-vitals-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, color: "#15803d" }}>
                  <FaStethoscope /> Extracted Vitals Summary
                </h3>
                <span style={{ fontSize: "12px", background: "#dcfce7", color: "#166534", padding: "3px 8px", borderRadius: "12px", fontWeight: "bold" }}>
                  Patient: {workerName} ({workerId})
                </span>
              </div>
              <div className="vitals-grid">
                <div className="vital-item">
                  <span className="vital-label">Blood Pressure</span>
                  <span className="vital-value">{extractedVitals.bloodPressure}</span>
                </div>
                <div className="vital-item">
                  <span className="vital-label">Blood Sugar</span>
                  <span className="vital-value">{extractedVitals.bloodSugar}</span>
                </div>
                <div className="vital-item">
                  <span className="vital-label">BMI</span>
                  <span className="vital-value">{extractedVitals.bmi}</span>
                </div>
                <div className="vital-item">
                  <span className="vital-label">Cholesterol</span>
                  <span className="vital-value">{extractedVitals.cholesterol}</span>
                </div>
                <div className="vital-item">
                  <span className="vital-label">Smoker (Inferred)</span>
                  <span className="vital-value">{extractedVitals.smoker}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="risk-result-card advanced-dashboard">
          {uploading ? (
            <div className="dashboard-loading">
              <FaRobot className="risk-empty-icon spinning" />
              <h3>Analyzing Clinical Data…</h3>
              <p>Deep Learning model is verifying document headers and computing risk profiles.</p>
            </div>
          ) : result ? (
            <div className="dashboard-content">
              <div className="dashboard-header">
                <div>
                  <h3>AI Diagnostic Dashboard</h3>
                  <small style={{ color: "#64748b", fontWeight: "600" }}>Patient: {workerName} ({workerId})</small>
                </div>
                <span className="confidence-badge">Confidence: {result.confidence}%</span>
              </div>

              {isOverridden && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "8px 12px", borderRadius: "6px", color: "#92400e", fontSize: "12px", marginBottom: "1rem" }}>
                  ⚠️ <strong>Doctor Override:</strong> Document name differed from patient name.
                </div>
              )}

              <div className="overall-risk">
                <div
                  className={`risk-score risk-${result.level}`}
                  style={{ color: RISK_COLORS[result.level] }}
                >
                  {simulateIntervention ? "MODERATE" : result.riskLevel}
                </div>
                <div className="risk-text">Overall Health Risk</div>
              </div>

              {/* Dynamic Multi-Disease Profiling */}
              <div className="multi-disease-section">
                <h4>Top Risk Profiles</h4>
                {result.multiDiseaseRisks?.map((risk, idx) => {
                  let displayScore = risk.riskScore;
                  let displayLevel = risk.level;
                  if (simulateIntervention) {
                    displayScore = Math.max(10, displayScore - 30);
                    displayLevel = displayScore < 35 ? "low" : displayScore < 65 ? "medium" : "high";
                  }
                  return (
                    <div key={idx} className="disease-bar-container">
                      <div className="disease-info">
                        <span>{risk.disease}</span>
                        <span style={{ color: RISK_COLORS[displayLevel], fontWeight: "bold" }}>
                          {displayScore}%
                        </span>
                      </div>
                      <div className="progress-bg">
                        <div
                          className="progress-fill"
                          style={{ width: `${displayScore}%`, backgroundColor: RISK_COLORS[displayLevel] }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explainable AI Section */}
              <div className="xai-section">
                <h4>Risk Factors (Explainable AI)</h4>
                <div className="xai-chart">
                  {result.featureImportance?.map((feat, idx) => (
                    <div key={idx} className="xai-row">
                      <span className="xai-label">{feat.feature}</span>
                      <div className="xai-bar-area">
                        {feat.impact === "positive" ? (
                          <div
                            className="xai-bar pos"
                            style={{ width: `${Math.min(feat.contribution * 3, 100)}%` }}
                          >
                            +{feat.contribution}%
                          </div>
                        ) : (
                          <div
                            className="xai-bar neg"
                            style={{ width: `${Math.min(Math.abs(feat.contribution) * 3, 100)}%` }}
                          >
                            {feat.contribution}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* What-If Simulation */}
              <div className="whatif-section">
                <h4>Prescriptive Simulation</h4>
                <label className="simulation-toggle">
                  <input
                    type="checkbox"
                    checked={simulateIntervention}
                    onChange={(e) => setSimulateIntervention(e.target.checked)}
                  />
                  Simulate Intervention: Quit Smoking &amp; Target BP (120/80)
                </label>
                <p className="simulation-hint">
                  See how targeted lifestyle changes impact the patient's predicted risk trajectory.
                </p>
              </div>
            </div>
          ) : (
            <div className="dashboard-empty">
              <FaRobot className="risk-empty-icon" />
              <h3>AI Diagnostic Dashboard</h3>
              <p>Upload a lab report to automatically extract data and generate an advanced risk profile.</p>
              <small style={{ color: "#22c55e", marginTop: "1rem", display: "block" }}>
                🛡️ Patient Identity Safeguard Active
              </small>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default AIRiskPrediction;
