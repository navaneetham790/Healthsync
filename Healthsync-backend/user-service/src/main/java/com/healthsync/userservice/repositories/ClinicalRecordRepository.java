package com.healthsync.userservice.repositories;

import com.healthsync.userservice.entities.ClinicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClinicalRecordRepository extends JpaRepository<ClinicalRecord, Long> {
    List<ClinicalRecord> findByWorkerIdAndType(Long workerId, String type);
    List<ClinicalRecord> findByWorkerId(Long workerId);
    List<ClinicalRecord> findByType(String type);
}
