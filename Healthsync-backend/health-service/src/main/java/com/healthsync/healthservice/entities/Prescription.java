package com.healthsync.healthservice.entities;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "prescriptions")
public class Prescription {
    
    @Id
    private String id;
    
    private Long workerId;
    private String medicine;
    private String dosage;
    private String frequency;
    private String instructions;
    private String prescriptionDate;
    private String doctorName;

    public Prescription() {
    }

    public Prescription(Long workerId, String medicine, String dosage, String frequency, String instructions, String prescriptionDate, String doctorName) {
        this.workerId = workerId;
        this.medicine = medicine;
        this.dosage = dosage;
        this.frequency = frequency;
        this.instructions = instructions;
        this.prescriptionDate = prescriptionDate;
        this.doctorName = doctorName;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getWorkerId() {
        return workerId;
    }

    public void setWorkerId(Long workerId) {
        this.workerId = workerId;
    }

    public String getMedicine() {
        return medicine;
    }

    public void setMedicine(String medicine) {
        this.medicine = medicine;
    }

    public String getDosage() {
        return dosage;
    }

    public void setDosage(String dosage) {
        this.dosage = dosage;
    }

    public String getFrequency() {
        return frequency;
    }

    public void setFrequency(String frequency) {
        this.frequency = frequency;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    public String getPrescriptionDate() {
        return prescriptionDate;
    }

    public void setPrescriptionDate(String prescriptionDate) {
        this.prescriptionDate = prescriptionDate;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }
}
