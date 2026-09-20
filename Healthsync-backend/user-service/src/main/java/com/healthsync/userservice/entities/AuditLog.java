package com.healthsync.userservice.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "audit_seq")
    @SequenceGenerator(name = "audit_seq", sequenceName = "AUDIT_SEQ", allocationSize = 1)
    private Long id;
    
    private String timestamp;
    private String action;
    private String details;
    private String role;

    public AuditLog() {
    }

    public AuditLog(String timestamp, String action, String details, String role) {
        this.timestamp = timestamp;
        this.action = action;
        this.details = details;
        this.role = role;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
