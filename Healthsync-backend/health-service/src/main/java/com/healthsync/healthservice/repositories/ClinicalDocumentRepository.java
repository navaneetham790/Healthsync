package com.healthsync.healthservice.repositories;

import com.healthsync.healthservice.entities.ClinicalDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClinicalDocumentRepository extends MongoRepository<ClinicalDocument, String> {
    List<ClinicalDocument> findByWorkerIdAndType(Long workerId, String type);
    List<ClinicalDocument> findByWorkerId(Long workerId);
    List<ClinicalDocument> findByType(String type);
    long countByType(String type);
}
