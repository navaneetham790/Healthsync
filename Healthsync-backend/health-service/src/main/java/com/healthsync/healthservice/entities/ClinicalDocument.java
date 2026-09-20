package com.healthsync.healthservice.entities;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "clinical_documents")
public class ClinicalDocument {

    @Id
    private String id;
    
    private String type; // "RECORD" or "PRESCRIPTION"
    private Long workerId;
    private String date; // visitDate or prescriptionDate
    
    // Health Record Fields
    private String diagnosis;
    private String summary;
    private String bloodPressure;
    private String sugar;
    private Double bmi;
    private String notes;
    
    // Prescription Fields
    private String medicine;
    private String dosage;
    private String frequency;
    private String duration;
    private String instructions;
    private String doctorName;
    private String doctorEmail;
    private String hospitalName;
    private String hospitalAddress;

    public ClinicalDocument() {
    }

    // Static constructor for a Health Record
    public static ClinicalDocument createRecord(Long workerId, String diagnosis, String summary, String bloodPressure, String sugar, Double bmi, String notes, String visitDate) {
        ClinicalDocument doc = new ClinicalDocument();
        doc.setType("RECORD");
        doc.setWorkerId(workerId);
        doc.setDiagnosis(diagnosis);
        doc.setSummary(summary);
        doc.setBloodPressure(bloodPressure);
        doc.setSugar(sugar);
        doc.setBmi(bmi);
        doc.setNotes(notes);
        doc.setDate(visitDate);
        return doc;
    }

    // Static constructor for a Prescription
    public static ClinicalDocument createPrescription(Long workerId, String medicine, String dosage, String frequency, String duration, String instructions, String prescriptionDate, String doctorName) {
        ClinicalDocument doc = new ClinicalDocument();
        doc.setType("PRESCRIPTION");
        doc.setWorkerId(workerId);
        doc.setMedicine(medicine);
        doc.setDosage(dosage);
        doc.setFrequency(frequency);
        doc.setDuration(duration);
        doc.setInstructions(instructions);
        doc.setDate(prescriptionDate);
        doc.setDoctorName(doctorName);
        return doc;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getWorkerId() {
        return workerId;
    }

    public void setWorkerId(Long workerId) {
        this.workerId = workerId;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getBloodPressure() {
        return bloodPressure;
    }

    public void setBloodPressure(String bloodPressure) {
        this.bloodPressure = bloodPressure;
    }

    public String getSugar() {
        return sugar;
    }

    public void setSugar(String sugar) {
        this.sugar = sugar;
    }

    public Double getBmi() {
        return bmi;
    }

    public void setBmi(Double bmi) {
        this.bmi = bmi;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }
    public String getDoctorEmail() { return doctorEmail; }
    public void setDoctorEmail(String doctorEmail) { this.doctorEmail = doctorEmail; }
    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }
    public String getHospitalAddress() { return hospitalAddress; }
    public void setHospitalAddress(String hospitalAddress) { this.hospitalAddress = hospitalAddress; }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }
}
