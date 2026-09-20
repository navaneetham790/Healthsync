import React from "react";
import "./PrescriptionDetails.css";

function PrescriptionDetails() {

  const prescription = {
    id: "PR001",
    doctor: "Dr. Kumar",
    hospital: "Apollo Hospital",
    date: "10-03-2025",
    diagnosis: "Viral Fever",
    medicines: [
      {
        name: "Paracetamol 500mg",
        dosage: "1 Tablet",
        timing: "Morning & Night",
        duration: "5 Days",
        food: "After Food"
      },
      {
        name: "Vitamin C",
        dosage: "1 Tablet",
        timing: "Morning",
        duration: "7 Days",
        food: "After Food"
      }
    ],
    advice: "Drink plenty of water, take complete rest and return for review if fever continues."
  };

  return (

    <div className="prescription-details">

      <div className="page-header">

        <h2>Prescription Details</h2>

        <p>Complete prescription information.</p>

      </div>

      <div className="prescription-card">

        <div className="top-info">

          <div>

            <h3>{prescription.doctor}</h3>

            <p>{prescription.hospital}</p>

          </div>

          <div>

            <p><strong>Prescription ID :</strong> {prescription.id}</p>

            <p><strong>Date :</strong> {prescription.date}</p>

          </div>

        </div>

        <hr />

        <div className="diagnosis">

          <h4>Diagnosis</h4>

          <p>{prescription.diagnosis}</p>

        </div>

        <h4>Medicines</h4>

        <table>

          <thead>

            <tr>

              <th>Medicine</th>

              <th>Dosage</th>

              <th>Timing</th>

              <th>Duration</th>

              <th>Food</th>

            </tr>

          </thead>

          <tbody>

            {prescription.medicines.map((item, index) => (

              <tr key={index}>

                <td>{item.name}</td>

                <td>{item.dosage}</td>

                <td>{item.timing}</td>

                <td>{item.duration}</td>

                <td>{item.food}</td>

              </tr>

            ))}

          </tbody>

        </table>

        <div className="advice">

          <h4>Doctor Advice</h4>

          <p>{prescription.advice}</p>

        </div>

        <button className="print-btn">

          Print Prescription

        </button>

      </div>

    </div>

  );

}

export default PrescriptionDetails;