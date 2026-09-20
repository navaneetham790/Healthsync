package com.healthsync.healthservice.entities;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "appointments")
public class Appointment {
    
    @Id
    private String id;
    
    private Long workerId;
    private String workerName;
    private String doctor;
    private String doctorEmail;
    private String appointmentAt; // e.g. "2026-08-10T14:30:00"
    private String reason;
    private String status; // PENDING, CONFIRMED, CANCELLED
    private String followUpDate;
    private String doctorNotes;
    private String completedAt;
    private String cancelReason;

    public Appointment() {
    }

    public Appointment(Long workerId, String workerName, String doctor, String appointmentAt, String reason, String status) {
        this.workerId = workerId;
        this.workerName = workerName;
        this.doctor = doctor;
        this.appointmentAt = appointmentAt;
        this.reason = reason;
        this.status = status;
    }

    public Appointment(Long workerId, String workerName, String doctor, String doctorEmail, String appointmentAt, String reason, String status) {
        this(workerId, workerName, doctor, appointmentAt, reason, status);
        this.doctorEmail = doctorEmail;
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

    public String getWorkerName() {
        return workerName;
    }

    public void setWorkerName(String workerName) {
        this.workerName = workerName;
    }

    public String getDoctor() {
        return doctor;
    }

    public void setDoctor(String doctor) {
        this.doctor = doctor;
    }

    public String getDoctorEmail() { return doctorEmail; }
    public void setDoctorEmail(String doctorEmail) { this.doctorEmail = doctorEmail; }

    public String getAppointmentAt() {
        return appointmentAt;
    }

    public void setAppointmentAt(String appointmentAt) {
        this.appointmentAt = appointmentAt;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
    public String getFollowUpDate() { return followUpDate; }
    public void setFollowUpDate(String followUpDate) { this.followUpDate = followUpDate; }
    public String getDoctorNotes() { return doctorNotes; }
    public void setDoctorNotes(String doctorNotes) { this.doctorNotes = doctorNotes; }
    public String getCompletedAt() { return completedAt; }
    public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }
    public String getCancelReason() { return cancelReason; }
    public void setCancelReason(String cancelReason) { this.cancelReason = cancelReason; }
}
