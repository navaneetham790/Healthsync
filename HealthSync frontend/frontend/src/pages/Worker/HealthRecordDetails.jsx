import React from "react";
import "./HealthRecordDetails.css";

function HealthRecordDetails() {

  const record = {
    id: "HR001",
    date: "10-03-2025",
    doctor: "Dr. Kumar",
    hospital: "Apollo Hospital",
    diagnosis: "Viral Fever",
    symptoms: "Fever, Headache, Body Pain",
    bloodPressure: "120 / 80 mmHg",
    heartRate: "78 bpm",
    temperature: "99.5 °F",
    medicines: "Paracetamol, Vitamin C",
    advice: "Take complete rest and drink plenty of water.",
    status: "Recovered"
  };

  return (

    <div className="record-details">

      <div className="page-header">

        <h2>Health Record Details</h2>

        <p>Complete medical information of the selected visit.</p>

      </div>

      <div className="details-card">

        <div className="details-grid">

          <div className="detail-item">
            <label>Record ID</label>
            <p>{record.id}</p>
          </div>

          <div className="detail-item">
            <label>Visit Date</label>
            <p>{record.date}</p>
          </div>

          <div className="detail-item">
            <label>Doctor</label>
            <p>{record.doctor}</p>
          </div>

          <div className="detail-item">
            <label>Hospital</label>
            <p>{record.hospital}</p>
          </div>

          <div className="detail-item">
            <label>Diagnosis</label>
            <p>{record.diagnosis}</p>
          </div>

          <div className="detail-item">
            <label>Symptoms</label>
            <p>{record.symptoms}</p>
          </div>

          <div className="detail-item">
            <label>Blood Pressure</label>
            <p>{record.bloodPressure}</p>
          </div>

          <div className="detail-item">
            <label>Heart Rate</label>
            <p>{record.heartRate}</p>
          </div>

          <div className="detail-item">
            <label>Temperature</label>
            <p>{record.temperature}</p>
          </div>

          <div className="detail-item">
            <label>Medicines</label>
            <p>{record.medicines}</p>
          </div>

          <div className="detail-item full-width">
            <label>Doctor Advice</label>
            <p>{record.advice}</p>
          </div>

          <div className="detail-item">
            <label>Status</label>

            <span className="status">
              {record.status}
            </span>

          </div>

        </div>

      </div>

    </div>

  );

}

export default HealthRecordDetails;