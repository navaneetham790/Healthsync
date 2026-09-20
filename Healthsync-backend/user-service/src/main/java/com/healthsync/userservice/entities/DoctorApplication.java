package com.healthsync.userservice.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "doctor_applications")
public class DoctorApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "doctor_application_seq")
    @SequenceGenerator(name = "doctor_application_seq", sequenceName = "DOCTOR_APPLICATION_SEQ", allocationSize = 1)
    private Long id;
    @Column(name = "INVITE_TOKEN", nullable = false, unique = true, length = 80)
    private String invitationToken;
    @Column(nullable = false) private String email;
    private String fullName;
    private String phone;
    @Column(name = "MED_REG_NO") private String medicalRegistrationNumber;
    private String medicalCouncil;
    private String registrationDate;
    private String registrationStatus;
    private String medicalDegree;
    private String specialization;
    private String hospital;
    @Column(length = 2000) private String hospitalAddress;
    private String experience;
    private String status = "INVITED";
    @Column(length = 2000) private String rejectionReason;
    private Instant invitedAt = Instant.now();
    private Instant submittedAt;
    private Instant reviewedAt;
    private Instant expiresAt;
    @JsonIgnore private String passwordHash;
    @JsonIgnore @Lob @Column(name = "REG_CERT_DATA") private String registrationCertificateData;
    @JsonIgnore @Column(name = "REG_CERT_NAME") private String registrationCertificateName;
    @JsonIgnore @Column(name = "REG_CERT_MIME") private String registrationCertificateMimeType;
    @JsonIgnore @Lob @Column(name = "GOV_ID_DATA") private String governmentIdData;
    @JsonIgnore @Column(name = "GOV_ID_NAME") private String governmentIdName;
    @JsonIgnore @Column(name = "GOV_ID_MIME") private String governmentIdMimeType;
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public String getInvitationToken(){return invitationToken;} public void setInvitationToken(String v){invitationToken=v;}
    public String getEmail(){return email;} public void setEmail(String v){email=v;}
    public String getFullName(){return fullName;} public void setFullName(String v){fullName=v;}
    public String getPhone(){return phone;} public void setPhone(String v){phone=v;}
    public String getMedicalRegistrationNumber(){return medicalRegistrationNumber;} public void setMedicalRegistrationNumber(String v){medicalRegistrationNumber=v;}
    public String getMedicalCouncil(){return medicalCouncil;} public void setMedicalCouncil(String v){medicalCouncil=v;}
    public String getRegistrationDate(){return registrationDate;} public void setRegistrationDate(String v){registrationDate=v;}
    public String getRegistrationStatus(){return registrationStatus;} public void setRegistrationStatus(String v){registrationStatus=v;}
    public String getMedicalDegree(){return medicalDegree;} public void setMedicalDegree(String v){medicalDegree=v;}
    public String getSpecialization(){return specialization;} public void setSpecialization(String v){specialization=v;}
    public String getHospital(){return hospital;} public void setHospital(String v){hospital=v;}
    public String getHospitalAddress(){return hospitalAddress;} public void setHospitalAddress(String v){hospitalAddress=v;}
    public String getExperience(){return experience;} public void setExperience(String v){experience=v;}
    public String getStatus(){return status;} public void setStatus(String v){status=v;}
    public String getRejectionReason(){return rejectionReason;} public void setRejectionReason(String v){rejectionReason=v;}
    public Instant getInvitedAt(){return invitedAt;} public void setInvitedAt(Instant v){invitedAt=v;}
    public Instant getSubmittedAt(){return submittedAt;} public void setSubmittedAt(Instant v){submittedAt=v;}
    public Instant getReviewedAt(){return reviewedAt;} public void setReviewedAt(Instant v){reviewedAt=v;}
    public Instant getExpiresAt(){return expiresAt;} public void setExpiresAt(Instant v){expiresAt=v;}
    public String getPasswordHash(){return passwordHash;} public void setPasswordHash(String v){passwordHash=v;}
    public String getRegistrationCertificateData(){return registrationCertificateData;} public void setRegistrationCertificateData(String v){registrationCertificateData=v;}
    public String getRegistrationCertificateName(){return registrationCertificateName;} public void setRegistrationCertificateName(String v){registrationCertificateName=v;}
    public String getRegistrationCertificateMimeType(){return registrationCertificateMimeType;} public void setRegistrationCertificateMimeType(String v){registrationCertificateMimeType=v;}
    public String getGovernmentIdData(){return governmentIdData;} public void setGovernmentIdData(String v){governmentIdData=v;}
    public String getGovernmentIdName(){return governmentIdName;} public void setGovernmentIdName(String v){governmentIdName=v;}
    public String getGovernmentIdMimeType(){return governmentIdMimeType;} public void setGovernmentIdMimeType(String v){governmentIdMimeType=v;}
}
