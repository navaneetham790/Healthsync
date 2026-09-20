package com.healthsync.healthservice.entities;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "health_records")
public class HealthRecord {
    
    @Id
    private String id;
    
    private Long workerId;
    private String diagnosis;
    private String summary;
    private String bloodPressure;
    private String sugar;
    private Double bmi;
    private String notes;
    private String visitDate;

    public HealthRecord() {
    }

    public HealthRecord(Long workerId, String diagnosis, String summary, String bloodPressure, String sugar, Double bmi, String notes, String visitDate) {
        this.workerId = workerId;
        this.diagnosis = diagnosis;
        this.summary = summary;
        this.bloodPressure = bloodPressure;
        this.sugar = sugar;
        this.bmi = bmi;
        this.notes = notes;
        this.visitDate = visitDate;
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

    public String getVisitDate() {
        return visitDate;
    }

    public void setVisitDate(String visitDate) {
        this.visitDate = visitDate;
    }
}
