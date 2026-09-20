package com.healthsync.userservice.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "settings")
public class Setting {
    
    @Id
    private Long id = 1L; // Only one row for system settings
    
    private String name = "Administrator";
    private String email = "healthsyncproject3502@gmail.com";
    private String phone = "9876543210";
    
    @Lob
    private String profilePicture = "";
    
    private Boolean twoFactor = false;
    private Boolean emailNotifications = true;
    private Boolean pushNotifications = true;
    private Boolean smsNotifications = false;
    private String theme = "light";
    private String language = "English";
    private String timeZone = "Asia/Kolkata";
    private Boolean privacyMode = true;
    private Integer activeSessions = 1;

    public Setting() {
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }

    public Boolean getTwoFactor() {
        return twoFactor;
    }

    public void setTwoFactor(Boolean twoFactor) {
        this.twoFactor = twoFactor;
    }

    public Boolean getEmailNotifications() {
        return emailNotifications;
    }

    public void setEmailNotifications(Boolean emailNotifications) {
        this.emailNotifications = emailNotifications;
    }

    public Boolean getPushNotifications() {
        return pushNotifications;
    }

    public void setPushNotifications(Boolean pushNotifications) {
        this.pushNotifications = pushNotifications;
    }

    public Boolean getSmsNotifications() {
        return smsNotifications;
    }

    public void setSmsNotifications(Boolean smsNotifications) {
        this.smsNotifications = smsNotifications;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getTimeZone() {
        return timeZone;
    }

    public void setTimeZone(String timeZone) {
        this.timeZone = timeZone;
    }

    public Boolean getPrivacyMode() {
        return privacyMode;
    }

    public void setPrivacyMode(Boolean privacyMode) {
        this.privacyMode = privacyMode;
    }

    public Integer getActiveSessions() {
        return activeSessions;
    }

    public void setActiveSessions(Integer activeSessions) {
        this.activeSessions = activeSessions;
    }
}
