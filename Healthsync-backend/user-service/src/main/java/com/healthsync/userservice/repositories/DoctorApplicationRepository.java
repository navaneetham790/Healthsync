package com.healthsync.userservice.repositories;

import com.healthsync.userservice.entities.DoctorApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DoctorApplicationRepository extends JpaRepository<DoctorApplication, Long> {
    Optional<DoctorApplication> findByInvitationToken(String invitationToken);
    Optional<DoctorApplication> findByEmailIgnoreCase(String email);
    boolean existsByMedicalRegistrationNumberIgnoreCase(String medicalRegistrationNumber);
}
