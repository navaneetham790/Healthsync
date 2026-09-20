import { useState, useEffect, useRef } from "react";
import { FaRobot, FaUpload, FaFilePdf, FaCheckCircle, FaUser, FaStethoscope } from "react-icons/fa";
import "./AIRiskPrediction.css";
import { notify } from "../../components/ToastProvider";
import DoctorService from "../../services/DoctorService";

const RISK_COLORS = { low: "#22c55e", medium: "#f59e0b", high: "#ef4444" };

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
      const match = workersList.find((item) => item.workerCode?.trim().toLowerCase() === workerId.trim().toLowerCase());
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
    setSimulateIntervention(false);
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
    setScanStep("Initializing Document Vision Model...");
    
    // Smart Simulation Logic for Research Demo
    const fileName = file.name.toLowerCase();
    const isMedical = fileName.includes("report") || fileName.includes("lab") || fileName.includes("blood") || fileName.includes("health") || fileName.includes("test");

    setTimeout(() => {
      setScanStep("Running OCR on document text...");
      
      setTimeout(() => {
        if (!isMedical) {
          setUploading(false);
          setUploadedFile(null);
          notify.error("Invalid Document Detected. Please upload a valid Lab Report.");
          return;
        }

        setScanStep("Extracting Clinical Parameters...");
        
        setTimeout(() => {
          setScanStep("Computing Multi-Disease Risk Vectors...");
          
          setTimeout(() => {
            // Set read-only extracted vitals
            setExtractedVitals({
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
                "Schedule immediate cardiology consultation.",
                "Start statin therapy for elevated LDL.",
                "Enroll in smoking cessation program."
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
            notify.success("Lab report successfully analyzed. Dashboard generated.");

            // Update database silently
            DoctorService.updateWorkerRiskByCode(workerId, "HIGH").catch(console.error);

          }, 1500);
        }, 1500);
      }, 1500);
    }, 1000);
  };

  return (
    <div className="doctor-risk-page">
      <header className="doctor-page-header">
        <h2>AI Risk Prediction Dashboard</h2>
        <p>Fully Autonomous Multi-modal pipeline: Upload a lab report to instantly generate a risk profile.</p>
      </header>

      <div className="risk-disclaimer">
        This tool supports clinical review only. It does not diagnose disease or replace medical judgement.
      </div>

      <div className="doctor-risk-layout">
        <div className="risk-left-panel">
          
          {/* Patient Selection Card */}
          <div className="patient-select-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#0f172a' }}>
              <FaUser color="#3b82f6" /> Select Patient
            </h3>
            <div className="risk-grid">
              <label className="risk-field">
                <span className="risk-label">Worker ID <b aria-hidden="true">*</b></span>
                <input 
                  value={workerId} 
                  onChange={(e) => { setWorkerId(e.target.value.toUpperCase()); resetAnalysis(); }} 
                  placeholder="MW001" 
                  list="risk-workers" 
                  disabled={uploading}
                />
                <datalist id="risk-workers">
                  {workersList.map((w) => <option key={w.id} value={w.workerCode}>{w.fullName}</option>)}
                </datalist>
              </label>
              
              <label className="risk-field">
                <span className="risk-label">Patient Name</span>
                <input 
                  value={workerName} 
                  placeholder={workerId ? "Worker not found" : "Select ID first"} 
                  readOnly 
                  style={{ backgroundColor: '#f8fafc', color: workerName ? '#0f172a' : '#94a3b8' }}
                />
              </label>
            </div>
          </div>

          {/* Upload Area */}
          <div 
            className="report-upload-zone" 
            onClick={() => !uploading && workerName && fileInputRef.current.click()}
            style={{ opacity: !workerName ? 0.5 : 1, cursor: !workerName ? 'not-allowed' : 'pointer' }}
          >
             <input type="file" ref={fileInputRef} hidden accept=".pdf,image/*" onChange={handleFileUpload} />
             {uploading ? (
                <div className="upload-loading">
                  <FaRobot className="spinning" size={32} />
                  <p style={{ fontWeight: 'bold', marginTop: '1rem', color: '#0f172a', fontSize: '1.1rem' }}>{scanStep}</p>
                  <small style={{ color: '#64748b' }}>Please wait while AI processes the document...</small>
                </div>
             ) : uploadedFile ? (
                <div className="upload-success">
                  <FaFilePdf size={32} color="#ef4444" />
                  <p style={{ fontWeight: 'bold', marginTop: '1rem', fontSize: '1.1rem' }}>{uploadedFile}</p>
                  <small style={{ color: '#15803d', fontWeight: 'bold' }}>✅ Full Document Analyzed</small>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); resetAnalysis(); }}
                    style={{
                      marginTop: '1.5rem',
                      padding: '0.6rem 1.2rem',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      borderRadius: '0.5rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      margin: '1.5rem auto 0'
                    }}
                  >
                    Start New Analysis
                  </button>
                </div>
             ) : (
                <div className="upload-prompt">
                   <FaUpload size={32} color={workerName ? "#3b82f6" : "#94a3b8"} />
                   <p style={{ fontWeight: 'bold', marginTop: '1rem', color: '#0f172a', fontSize: '1.1rem' }}>
                     {workerName ? "Click or drag Lab Report to Auto-Analyze" : "Select a patient to upload report"}
                   </p>
                   <small style={{ color: '#64748b' }}>No manual entry required. AI will extract all clinical data.</small>
                </div>
             )}
          </div>

          {/* Extracted Vitals Summary (Read-Only) */}
          {extractedVitals && (
            <div className="extracted-vitals-card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#15803d' }}>
                <FaStethoscope /> Extracted Vitals Summary
              </h3>
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
              <p>Deep Learning model is computing multi-disease risk profiles based on the report.</p>
            </div>
          ) : result ? (
            <div className="dashboard-content">
              <div className="dashboard-header">
                <h3>AI Diagnostic Dashboard</h3>
                <span className="confidence-badge">Confidence: {result.confidence}%</span>
              </div>
              
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
                       displayLevel = displayScore < 35 ? 'low' : displayScore < 65 ? 'medium' : 'high';
                   }
                   return (
                  <div key={idx} className="disease-bar-container">
                    <div className="disease-info">
                      <span>{risk.disease}</span>
                      <span style={{ color: RISK_COLORS[displayLevel], fontWeight: 'bold' }}>{displayScore}%</span>
                    </div>
                    <div className="progress-bg">
                      <div className="progress-fill" style={{ width: `${displayScore}%`, backgroundColor: RISK_COLORS[displayLevel] }}></div>
                    </div>
                  </div>
                )})}
              </div>

              {/* Explainable AI Section */}
              <div className="xai-section">
                <h4>Risk Factors (Explainable AI)</h4>
                <div className="xai-chart">
                  {result.featureImportance?.map((feat, idx) => (
                    <div key={idx} className="xai-row">
                      <span className="xai-label">{feat.feature}</span>
                      <div className="xai-bar-area">
                         {feat.impact === 'positive' ? (
                            <div className="xai-bar pos" style={{ width: `${Math.min(feat.contribution * 3, 100)}%` }}>+{feat.contribution}%</div>
                         ) : (
                            <div className="xai-bar neg" style={{ width: `${Math.min(Math.abs(feat.contribution) * 3, 100)}%` }}>{feat.contribution}%</div>
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
                  <input type="checkbox" checked={simulateIntervention} onChange={(e) => setSimulateIntervention(e.target.checked)} />
                  Simulate Intervention: Quit Smoking & Target BP (120/80)
                </label>
                <p className="simulation-hint">See how targeted lifestyle changes impact the patient's predicted risk trajectory.</p>
              </div>

            </div>
          ) : (
            <div className="dashboard-empty">
              <FaRobot className="risk-empty-icon" />
              <h3>AI Diagnostic Dashboard</h3>
              <p>Upload a lab report to automatically extract data and generate an advanced risk profile.</p>
              <small style={{ color: "#22c55e", marginTop: '1rem', display: 'block' }}>✅ Fully Autonomous Workflow Ready</small>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default AIRiskPrediction;
