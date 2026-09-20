package com.healthsync.healthservice.repositories;

import com.healthsync.healthservice.entities.Appointment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends MongoRepository<Appointment, String> {
    List<Appointment> findByWorkerId(Long workerId);
    List<Appointment> findByDoctor(String doctor);
    List<Appointment> findByDoctorEmail(String doctorEmail);
}
