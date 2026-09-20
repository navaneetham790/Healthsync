import { useState } from "react";
import { FaPlus, FaTimes, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaInfoCircle } from "react-icons/fa";
import "./DrugInteraction.css";
import { notify } from "../../components/ToastProvider";
import DoctorService from "../../services/DoctorService";

const SEVERITY_CONFIG = {
  Major:    { color: "result-high",   icon: <FaTimesCircle />,         label: "🔴 High Risk Interaction" },
  Moderate: { color: "result-medium", icon: <FaExclamationTriangle />, label: "🟠 Moderate Interaction" },
  Minor:    { color: "result-low",    icon: <FaInfoCircle />,           label: "🟡 Minor Interaction" },
  None:     { color: "result-safe",   icon: <FaCheckCircle />,          label: "✅ No Known Interaction Found" },
};

function DrugInteraction() {
  const [medicines, setMedicines] = useState(["", ""]);
  const [results, setResults]     = useState(null);
  const [loading, setLoading]     = useState(false);

  const update = (i, v) => {
    setMedicines(medicines.map((m, idx) => idx === i ? v : m));
    setResults(null);
  };
  const add = () => {
    setMedicines([...medicines, ""]);
    setResults(null);
  };
  const remove = (i) => {
    if (medicines.length <= 2) return;
    setMedicines(medicines.filter((_, idx) => idx !== i));
    setResults(null);
  };

  const check = async () => {
    const names = medicines.map(m => m.trim());
    if (names.some(m => !m)) {
      notify.warning("Enter all medicine names before checking.");
      return;
    }
    if (new Set(names.map(m => m.toLowerCase())).size !== names.length) {
      notify.warning("Duplicate medicine detected.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await DoctorService.checkDrugInteraction(names);
      setResults(data);
    } catch (error) {
      notify.error(error.response?.data?.message || "Failed to check drug interactions with ML Service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="doctor-drug-page">
      <div className="doctor-page-header">
        <h2>Drug Interaction Checker</h2>
        <p>Powered by HealthSync AI ML Service &amp; Clinical Database.</p>
      </div>

      <div className="doctor-drug-card">
        {medicines.map((medicine, index) => (
          <div className="doctor-form-group" key={index}>
            <div className="medicine-label">
              <label htmlFor={`med-${index}`}>Medicine {index + 1}</label>
              {medicines.length > 2 && (
                <button type="button" className="remove-medicine-btn" onClick={() => remove(index)}>
                  <FaTimes />
                </button>
              )}
            </div>
            <input
              id={`med-${index}`}
              type="text"
              placeholder="e.g. Aspirin 75mg"
              value={medicine}
              onChange={(e) => update(index, e.target.value)}
            />
          </div>
        ))}

        <div className="drug-actions">
          <button type="button" className="add-medicine-btn" onClick={add}>
            <FaPlus /> Add medicine
          </button>
          <button type="button" className="doctor-check-btn" onClick={check} disabled={loading}>
            {loading ? "Checking with AI..." : "Check Interactions"}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="interaction-results">
            <h3>Results for: {results.medicines.join(" + ")}</h3>

            {results.interactions.length === 0 ? (
              <div className="result-card result-safe">
                <span className="result-icon">{SEVERITY_CONFIG.None.icon}</span>
                <div>
                  <strong>{SEVERITY_CONFIG.None.label}</strong>
                  <p>No known interactions found between these medicines in our database or AI prediction model.</p>
                </div>
              </div>
            ) : (
              results.interactions.map((item, i) => {
                const severity = item.severity || "None";
                const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.None;
                return (
                  <div className={`result-card ${cfg.color}`} key={i}>
                    <span className="result-icon">{cfg.icon}</span>
                    <div style={{ width: "100%" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong>{cfg.label}</strong>
                        <span className="method-badge">
                          {item.method} ({item.confidence}%)
                        </span>
                      </div>
                      <p className="result-pair">{item.pair}</p>
                      <p className="result-effect">{item.effect}</p>
                    </div>
                  </div>
                );
              })
            )}

            <div className="result-disclaimer">
              ⚕️ This tool is for decision support only. Always consult verified clinical references before prescribing.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DrugInteraction;
