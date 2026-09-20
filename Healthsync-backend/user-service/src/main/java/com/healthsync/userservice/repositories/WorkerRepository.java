package com.healthsync.userservice.repositories;

import com.healthsync.userservice.entities.Worker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkerRepository extends JpaRepository<Worker, Long> {
    Optional<Worker> findByEmail(String email);
    Optional<Worker> findByWorkerCode(String workerCode);
    List<Worker> findByFullNameContainingIgnoreCase(String name);
    long countByRiskLevelIgnoreCase(String riskLevel);
}
