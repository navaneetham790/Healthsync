package com.healthsync.userservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "workers")
public class Worker {
    
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "worker_seq")
    @SequenceGenerator(name = "worker_seq", sequenceName = "WORKER_SEQ", allocationSize = 1)
    private Long id;
    
    @Column(nullable = false)
    private String fullName;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    private String phone;
    
    @Column(unique = true)
    private String workerCode;
    
    private Integer age;
    
    @Column(name = "created_at", updatable = false)
    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();
    @Column(length = 1000)
    private String diseases;
    
    @Column(length = 2000)
    private String healthHistory;
    
    private String role = "worker";
    private String riskLevel = "Not assessed";
    private Boolean twoFactor = false;
    private Boolean emailNotifications = true;
    private Boolean pushNotifications = true;
    private String theme = "light";
    private String language = "English";
    private String createdByDoctorEmail;

    public Worker() {
    }

    public Worker(String fullName, String email, String password, String phone, String workerCode, Integer age, String diseases, String healthHistory) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.workerCode = workerCode;
        this.age = age;
        this.diseases = diseases;
        this.healthHistory = healthHistory;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @JsonIgnore
    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getWorkerCode() {
        return workerCode;
    }

    public void setWorkerCode(String workerCode) {
        this.workerCode = workerCode;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getDiseases() {
        return diseases;
    }

    public void setDiseases(String diseases) {
        this.diseases = diseases;
    }

    public String getHealthHistory() {
        return healthHistory;
    }

    public void setHealthHistory(String healthHistory) {
        this.healthHistory = healthHistory;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public Boolean getTwoFactor() { return twoFactor; }
    public void setTwoFactor(Boolean twoFactor) { this.twoFactor = twoFactor; }
    public Boolean getEmailNotifications() { return emailNotifications; }
    public void setEmailNotifications(Boolean emailNotifications) { this.emailNotifications = emailNotifications; }
    public Boolean getPushNotifications() { return pushNotifications; }
    public void setPushNotifications(Boolean pushNotifications) { this.pushNotifications = pushNotifications; }
    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getCreatedByDoctorEmail() { return createdByDoctorEmail; }
    public void setCreatedByDoctorEmail(String createdByDoctorEmail) { this.createdByDoctorEmail = createdByDoctorEmail; }
}
