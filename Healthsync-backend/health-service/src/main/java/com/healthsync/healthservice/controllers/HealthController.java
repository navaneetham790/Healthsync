package com.healthsync.healthservice.controllers;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.healthsync.healthservice.entities.Appointment;
import com.healthsync.healthservice.entities.ClinicalDocument;
import com.healthsync.healthservice.repositories.AppointmentRepository;
import com.healthsync.healthservice.repositories.ClinicalDocumentRepository;
import com.healthsync.healthservice.security.JwtUtil;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.io.ByteArrayOutputStream;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class HealthController {

    @Autowired
    private ClinicalDocumentRepository clinicalDocumentRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${user.service.url}")
    private String userServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final Map<String, QrAccess> qrAccessTokens = new ConcurrentHashMap<>();

    @PostConstruct
    public void initData() {
        if (appointmentRepository.count() == 0) {
            Appointment a1 = new Appointment(3L, "Saravanan P", "Dr. Rajesh Sharma", "rajesh.sharma@healthsync.com", "2026-09-25T10:30:00", "Diabetic follow-up consultation", "CONFIRMED");
            appointmentRepository.save(a1);

            Appointment a2 = new Appointment(5L, "Vignesh M", "Dr. Anitha Raman", "anitha.r@healthsync.com", "2026-09-26T11:00:00", "Pulmonary function test review", "CONFIRMED");
            appointmentRepository.save(a2);

            Appointment a3 = new Appointment(8L, "Prakash V", "Dr. Rajesh Sharma", "rajesh.sharma@healthsync.com", "2026-09-27T14:00:00", "Cardiology stress test evaluation", "CONFIRMED");
            appointmentRepository.save(a3);

            Appointment a4 = new Appointment(2L, "Murugan S", "Dr. Priya Venkatesh", "priya.v@healthsync.com", "2026-09-28T09:30:00", "BP review consultation", "PENDING");
            appointmentRepository.save(a4);
        }

        if (clinicalDocumentRepository.count() == 0) {
            ClinicalDocument d1 = ClinicalDocument.createRecord(3L, "Type 2 Diabetes Mellitus with Stage 1 Hypertension", "Diabetic & BP Health Record", "142/90", "165", 26.4, "Patient advised low carb diet, 30 min daily walking, and HbA1c retest in 3 months.", "2026-09-18");
            d1.setDoctorName("Dr. Rajesh Sharma");
            d1.setDoctorEmail("rajesh.sharma@healthsync.com");
            d1.setHospitalName("Apollo Hospital");
            d1.setHospitalAddress("Greams Road, Thousand Lights, Chennai");
            clinicalDocumentRepository.save(d1);

            ClinicalDocument d2 = ClinicalDocument.createRecord(5L, "Chronic Bronchitis with Moderate Persistent Asthma", "Pulmonary Health Record", "125/82", "98", 24.1, "Spirometry shows FEV1 at 72%. Avoid factory dust exposure and use N95 protective mask.", "2026-09-19");
            d2.setDoctorName("Dr. Anitha Raman");
            d2.setDoctorEmail("anitha.r@healthsync.com");
            d2.setHospitalName("Fortis Malar Hospital");
            d2.setHospitalAddress("Gandhi Nagar, Adyar, Chennai");
            clinicalDocumentRepository.save(d2);

            ClinicalDocument p1 = ClinicalDocument.createPrescription(3L, "Metformin 500mg, Telmisartan 40mg", "1 tablet twice daily", "Twice daily", "30 days", "Take Metformin after food and Telmisartan morning empty stomach.", "2026-09-18", "Dr. Rajesh Sharma");
            p1.setDoctorEmail("rajesh.sharma@healthsync.com");
            p1.setHospitalName("Apollo Hospital");
            clinicalDocumentRepository.save(p1);
        }
    }


    // ==========================================
    // CLINICAL RECORDS & PRESCRIPTIONS
    // ==========================================

    @GetMapping("/doctor/health-records")
    public ResponseEntity<?> getDoctorHealthRecords(@RequestHeader("Authorization") String authHeader) {
        doctorEmail(authHeader);
        return ResponseEntity.ok(clinicalDocumentRepository.findByType("RECORD"));
    }

    @PostMapping("/doctor/health-records")
    public ResponseEntity<?> addHealthRecord(@RequestHeader("Authorization") String authHeader, @RequestBody Map<String, Object> payload) {
        try {
            Long workerId = Long.valueOf(payload.get("workerId").toString());
            String diagnosis = (String) payload.get("diagnosis");
            String summary = (String) payload.get("summary");
            String bloodPressure = (String) payload.get("bloodPressure");
            String sugar = (String) payload.get("sugar");
            Double bmi = Double.valueOf(payload.get("bmi").toString());
            String notes = (String) payload.get("notes");
            
            String visitDate = String.valueOf(payload.getOrDefault("visitDate", new SimpleDateFormat("yyyy-MM-dd").format(new Date())));

            ClinicalDocument doc = ClinicalDocument.createRecord(workerId, diagnosis, summary, bloodPressure, sugar, bmi, notes, visitDate);
            applyProviderDetails(doc, authHeader);
            clinicalDocumentRepository.save(doc);
            
            return ResponseEntity.ok(doc);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/doctor/prescriptions")
    public ResponseEntity<?> createPrescription(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> payload) {
        try {
            Long workerId = Long.valueOf(payload.get("workerId").toString());
            String medicine = (String) payload.get("medicine");
            String dosage = (String) payload.get("dosage");
            String frequency = (String) payload.get("frequency");
            String duration = (String) payload.get("duration");
            String instructions = (String) payload.get("instructions");
            
            String prescriptionDate = String.valueOf(payload.getOrDefault("prescriptionDate", new SimpleDateFormat("yyyy-MM-dd").format(new Date())));
            // Store the currently signed-in doctor's name, not a fixed doctor name.
            doctorEmail(authHeader);
            String doctorName = doctorName(authHeader);
            if (doctorName.isBlank()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Unable to identify the signed-in doctor."));
            }

            ClinicalDocument doc = ClinicalDocument.createPrescription(workerId, medicine, dosage, frequency, duration, instructions, prescriptionDate, doctorName);
            applyProviderDetails(doc, authHeader);
            clinicalDocumentRepository.save(doc);

            return ResponseEntity.ok(doc);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/worker/healthrecords/{id}")
    public ResponseEntity<?> getWorkerHealthRecords(@RequestHeader("Authorization") String authHeader, @PathVariable Long id) {
        if (!canReadWorkerData(authHeader, id)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "You are not allowed to view this patient's health records."));
        return ResponseEntity.ok(backfillProviderDetails(id, clinicalDocumentRepository.findByWorkerIdAndType(id, "RECORD")));
    }

    @GetMapping("/worker/prescriptions/{id}")
    public ResponseEntity<?> getWorkerPrescriptions(@RequestHeader("Authorization") String authHeader, @PathVariable Long id) {
        if (!canReadWorkerData(authHeader, id)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "You are not allowed to view this patient's prescriptions."));
        return ResponseEntity.ok(backfillProviderDetails(id, clinicalDocumentRepository.findByWorkerIdAndType(id, "PRESCRIPTION")));
    }

    // ==========================================
    // APPOINTMENTS
    // ==========================================

    @GetMapping("/doctor/appointments")
    public ResponseEntity<?> getDoctorAppointments(@RequestHeader("Authorization") String authHeader) {
        String doctorEmail = doctorEmail(authHeader);
        String doctorName = doctorName(authHeader);
        List<Appointment> appointments = new ArrayList<>(appointmentRepository.findByDoctorEmail(doctorEmail));
        // Migrate legacy appointments which stored only the doctor's display name.
        appointmentRepository.findByDoctor(doctorName).stream()
                .filter(appointment -> appointment.getDoctorEmail() == null || appointment.getDoctorEmail().isBlank())
                .forEach(appointment -> { appointment.setDoctorEmail(doctorEmail); appointmentRepository.save(appointment); appointments.add(appointment); });
        return ResponseEntity.ok(appointments);
    }

    @PatchMapping("/doctor/appointments/{id}")
    public ResponseEntity<?> updateAppointmentStatus(@PathVariable String id, @RequestHeader("Authorization") String authHeader, @RequestBody Map<String, String> payload) {
        Optional<Appointment> opt = appointmentRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Appointment not found."));
        }
        
        Appointment app = opt.get();
        if (app.getDoctorEmail() == null || !app.getDoctorEmail().equalsIgnoreCase(doctorEmail(authHeader))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "This appointment is assigned to another doctor."));
        }
        String status = payload.get("status");
        if (!Set.of("CONFIRMED", "CANCELLED", "COMPLETED").contains(status)) return ResponseEntity.badRequest().body(Map.of("message", "Invalid appointment status."));
        if ("COMPLETED".equals(status) && !"CONFIRMED".equalsIgnoreCase(app.getStatus())) return ResponseEntity.badRequest().body(Map.of("message", "Only a confirmed appointment can be completed."));
        app.setStatus(status);
        if ("COMPLETED".equals(status)) {
            app.setDoctorNotes(payload.getOrDefault("doctorNotes", ""));
            app.setFollowUpDate(payload.getOrDefault("followUpDate", ""));
            app.setCompletedAt(new SimpleDateFormat("yyyy-MM-dd HH:mm").format(new Date()));
        } else if ("CANCELLED".equals(status)) {
            app.setCancelReason(payload.getOrDefault("cancelReason", "No reason provided"));
        }
        appointmentRepository.save(app);
        
        return ResponseEntity.ok(app);
    }

    @GetMapping("/worker/appointments/{id}")
    public ResponseEntity<?> getWorkerAppointments(@RequestHeader("Authorization") String authHeader, @PathVariable Long id) {
        if (!isCurrentWorker(authHeader, id)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "You can only view your own appointments."));
        return ResponseEntity.ok(appointmentRepository.findByWorkerId(id));
    }

    @PostMapping("/worker/appointments")
    public ResponseEntity<?> bookAppointment(@RequestHeader("Authorization") String authHeader, @RequestBody Map<String, Object> payload) {
        try {
            Long workerId = Long.valueOf(payload.get("workerId").toString());
            if (!isCurrentWorker(authHeader, workerId)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "You can only book an appointment for yourself."));
            String workerName = (String) payload.get("workerName");
            String doctorName = (String) payload.get("doctor");
            String doctorEmail = (String) payload.get("doctorEmail");
            String date = (String) payload.get("date");
            String time = (String) payload.get("time");
            String reason = (String) payload.get("reason");

            Appointment app = new Appointment(workerId, workerName, doctorName, doctorEmail, date + "T" + time, reason, "PENDING");
            appointmentRepository.save(app);

            return ResponseEntity.ok(app);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }

    /** Used by user-service to enforce the same appointment-based patient boundary. */
    @GetMapping("/internal/doctor-patients/{workerId}")
    public ResponseEntity<Boolean> isDoctorPatient(@RequestHeader("Authorization") String authHeader, @PathVariable Long workerId) {
        return ResponseEntity.ok(doctorCanAccessWorker(doctorEmail(authHeader), workerId));
    }

    /** Lists workers with an active appointment assigned to the signed-in doctor. */
    @GetMapping("/internal/doctor-patient-ids")
    public ResponseEntity<?> getDoctorPatientIds(@RequestHeader("Authorization") String authHeader) {
        String email = doctorEmail(authHeader);
        return ResponseEntity.ok(appointmentRepository.findByDoctorEmail(email).stream()
                .filter(appointment -> !"CANCELLED".equalsIgnoreCase(appointment.getStatus()))
                .map(Appointment::getWorkerId)
                .filter(Objects::nonNull)
                .distinct()
                .toList());
    }

    /** Returns legacy workers who have an existing clinical record from this doctor. */
    @GetMapping("/internal/doctor-legacy-workers")
    public ResponseEntity<?> getLegacyDoctorWorkers(@RequestHeader("Authorization") String authHeader) {
        String email = doctorEmail(authHeader);
        String name = doctorName(authHeader);
        List<Long> workerIds = clinicalDocumentRepository.findAll().stream()
                .filter(document -> email.equalsIgnoreCase(String.valueOf(document.getDoctorEmail()))
                        || name.equalsIgnoreCase(String.valueOf(document.getDoctorName())))
                .map(ClinicalDocument::getWorkerId).filter(Objects::nonNull).distinct().toList();
        return ResponseEntity.ok(workerIds);
    }

    private boolean doctorCanAccessWorker(String doctorEmail, Long workerId) {
        return appointmentRepository.findByWorkerId(workerId).stream().anyMatch(appointment ->
                doctorEmail.equalsIgnoreCase(appointment.getDoctorEmail())
                        && !"CANCELLED".equalsIgnoreCase(appointment.getStatus()));
    }

    private boolean canReadWorkerData(String authHeader, Long workerId) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return false;
        String token = authHeader.substring(7);
        String role = jwtUtil.role(token);
        if ("doctor".equalsIgnoreCase(role) || "admin".equalsIgnoreCase(role)) return true;
        // A worker can read only records whose workerId matches the authenticated JWT.
        if ("worker".equalsIgnoreCase(role)) return Objects.equals(jwtUtil.id(token), workerId);
        return false;
    }

    @SuppressWarnings("unchecked")
    private void applyProviderDetails(ClinicalDocument document, String authHeader) {
        document.setDoctorEmail(doctorEmail(authHeader));
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", authHeader);
            ResponseEntity<Map> profile = restTemplate.exchange(userServiceUrl + "/api/doctor/profile", HttpMethod.GET, new HttpEntity<>(headers), Map.class);
            Map<String, Object> doctor = profile.getBody();
            document.setDoctorName(doctor != null && doctor.get("fullName") != null ? doctor.get("fullName").toString() : "Doctor");
            document.setHospitalName(doctor != null && doctor.get("hospital") != null ? doctor.get("hospital").toString() : "");
            document.setHospitalAddress(doctor != null ? hospitalAddress(doctor) : "");
        } catch (Exception ignored) {
            document.setHospitalName("Not provided");
            document.setHospitalAddress("Not provided");
        }
    }

    private boolean isCurrentWorker(String authHeader, Long workerId) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return false;
        try {
            String token = authHeader.substring(7);
            return "worker".equalsIgnoreCase(jwtUtil.role(token)) && Objects.equals(jwtUtil.id(token), workerId);
        } catch (Exception ignored) { return false; }
    }

    private String doctorEmail(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) throw new IllegalArgumentException("Doctor authentication is required.");
        String token = authHeader.substring(7);
        if (!"doctor".equalsIgnoreCase(jwtUtil.role(token))) throw new IllegalArgumentException("Doctor access is required.");
        return jwtUtil.email(token).trim().toLowerCase();
    }

    @SuppressWarnings("unchecked")
    private String doctorName(String authHeader) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", authHeader);
            ResponseEntity<Map> response = restTemplate.exchange(userServiceUrl + "/api/doctor/profile", HttpMethod.GET, new HttpEntity<>(headers), Map.class);
            Object name = response.getBody() == null ? null : response.getBody().get("fullName");
            return name == null ? "" : name.toString();
        } catch (Exception ignored) { return ""; }
    }

    // ==========================================
    // QR CODE GENERATION & DOWNLOAD
    // ==========================================

    @PostMapping("/doctor/workers/{workerId}/qr")
    public ResponseEntity<byte[]> generateQR(@PathVariable Long workerId) {
        return getQRBytes(workerId);
    }

    @GetMapping("/doctor/workers/{workerId}/qr")
    public ResponseEntity<byte[]> getDoctorQR(@PathVariable Long workerId) {
        return getQRBytes(workerId);
    }

    @GetMapping("/worker/qr/{workerId}/download")
    public ResponseEntity<byte[]> getWorkerQR(@PathVariable Long workerId) {
        return getQRBytes(workerId);
    }

    private ResponseEntity<byte[]> getQRBytes(Long workerId) {
        try {
            // Point the QR code text to the public details web page
            String qrUrl = "http://localhost:5173/worker-qr/" + workerId;
            
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(qrUrl, BarcodeFormat.QR_CODE, 300, 300);
            
            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            byte[] imageBytes = pngOutputStream.toByteArray();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setContentLength(imageBytes.length);
            
            return new ResponseEntity<>(imageBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/public/workers/{id}/otp/send")
    public ResponseEntity<?> sendPublicQrOtp(@PathVariable Long id) {
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(userServiceUrl + "/api/internal/workers/" + id + "/qr-otp/send", null, Map.class);
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (Exception exception) { return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Unable to send verification code.")); }
    }

    @PostMapping("/public/workers/{id}/otp/verify")
    public ResponseEntity<?> verifyPublicQrOtp(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(userServiceUrl + "/api/internal/workers/" + id + "/qr-otp/verify", payload, Map.class);
            if (!response.getStatusCode().is2xxSuccessful()) return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
            String token = UUID.randomUUID().toString();
            qrAccessTokens.put(token, new QrAccess(id, System.currentTimeMillis() + 10 * 60 * 1000L));
            return ResponseEntity.ok(Map.of("accessToken", token, "expiresInMinutes", 10));
        } catch (Exception exception) { return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Incorrect or expired verification code.")); }
    }

    // ==========================================
    // AI RISK PREDICTION
    // ==========================================

    @PostMapping("/doctor/risk-prediction")
    public ResponseEntity<?> predictRisk(@RequestBody Map<String, Object> payload) {
        try {
            int age = Integer.parseInt(payload.get("age").toString());
            String bloodPressure = (String) payload.get("bloodPressure");
            int bloodSugar = Integer.parseInt(payload.get("bloodSugar").toString());
            double bmi = Double.parseDouble(payload.get("bmi").toString());
            String smoker = (String) payload.get("smoker");
            String conditions = (String) payload.get("conditions");

            int score = 12;
            if (age >= 55) score += 18;
            if (bloodPressure != null && bloodPressure.contains("/")) {
                String[] bp = bloodPressure.split("/");
                int systolic = Integer.parseInt(bp[0]);
                int diastolic = Integer.parseInt(bp[1]);
                if (systolic >= 140 || diastolic >= 90) score += 25;
            }
            if (bloodSugar >= 126) score += 22;
            if (bmi >= 30.0) score += 12;
            if ("yes".equalsIgnoreCase(smoker)) score += 15;
            if (conditions != null && !conditions.trim().isEmpty()) score += 10;

            String level = score >= 55 ? "high" : score >= 30 ? "medium" : "low";
            int finalScore = Math.min(score, 95);

            return ResponseEntity.ok(Map.of("level", level, "score", finalScore));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid input parameters."));
        }
    }

    @GetMapping("/worker/riskprediction/{id}")
    public ResponseEntity<?> getWorkerAIRisk(@PathVariable Long id) {
        List<ClinicalDocument> records = clinicalDocumentRepository.findByWorkerIdAndType(id, "RECORD");
        if (records.isEmpty()) {
            return ResponseEntity.ok(Map.of("level", "low", "score", 15, "notes", "No clinical records available. Default low risk assumed."));
        }

        // Get latest record
        ClinicalDocument latest = records.get(records.size() - 1);
        
        // Simple heuristic calculation based on latest health record
        int score = 15;
        if (latest.getBmi() != null && latest.getBmi() >= 30.0) score += 15;
        if (latest.getBloodPressure() != null && latest.getBloodPressure().contains("/")) {
            String[] bp = latest.getBloodPressure().split("/");
            try {
                int sys = Integer.parseInt(bp[0].trim());
                int dia = Integer.parseInt(bp[1].trim());
                if (sys >= 140 || dia >= 90) score += 25;
            } catch (Exception ignored) {}
        }
        
        String level = score >= 55 ? "high" : score >= 30 ? "medium" : "low";
        
        return ResponseEntity.ok(Map.of(
                "level", level,
                "score", score,
                "latestRecordId", latest.getId(),
                "notes", "Risk score computed from record date: " + latest.getDate()
        ));
    }

    // ==========================================
    // PUBLIC DATA RETRIEVAL (LINKED BY QR CODE)
    // ==========================================

    @GetMapping("/public/workers/{id}")
    public ResponseEntity<?> getPublicWorkerDetails(@PathVariable Long id) {
        try {
            // Get worker details from User Service
            String userServiceUrl = this.userServiceUrl + "/api/internal/workers/" + id;
            Map<?, ?> workerMap = null;
            try {
                workerMap = restTemplate.getForObject(userServiceUrl, Map.class);
            } catch (Exception e) {
                // If User Service is down, use fallback mock worker details
                workerMap = Map.of(
                        "fullName", "Ramesh Kumar (Fallback)",
                        "workerCode", "MW001",
                        "age", 34,
                        "phone", "9999888877",
                        "diseases", "None",
                        "healthHistory", "Migrant Worker Profile"
                );
            }

            // Use saved profile riskLevel from user-service
            String riskLevel = "-";
            if (workerMap != null && workerMap.get("riskLevel") != null) {
                String savedRisk = workerMap.get("riskLevel").toString().trim();
                if (!savedRisk.isEmpty() && !"Not assessed".equalsIgnoreCase(savedRisk)) {
                    riskLevel = savedRisk.toUpperCase();
                }
            }

            // Merge details
            Map<String, Object> workerDetails = new HashMap<>();
            workerDetails.put("fullName", workerMap.get("fullName"));
            workerDetails.put("workerCode", workerMap.get("workerCode"));
            workerDetails.put("age", workerMap.get("age"));
            workerDetails.put("phone", workerMap.get("phone"));
            workerDetails.put("diseases", workerMap.get("diseases"));
            workerDetails.put("healthHistory", workerMap.get("healthHistory"));
            workerDetails.put("riskLevel", riskLevel.toUpperCase());

            // Fetch records & prescriptions
            List<ClinicalDocument> records = backfillProviderDetails(id, clinicalDocumentRepository.findByWorkerIdAndType(id, "RECORD"));
            List<ClinicalDocument> prescriptions = backfillProviderDetails(id, clinicalDocumentRepository.findByWorkerIdAndType(id, "PRESCRIPTION"));

            Map<String, Object> response = new HashMap<>();
            response.put("worker", workerDetails);
            response.put("healthRecords", records);
            response.put("prescriptions", prescriptions);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Error compiling worker details: " + e.getMessage()));
        }
    }

    private record QrAccess(Long workerId, long expiresAt) {}

    /** Repairs legacy records created before provider details were stored. */
    @SuppressWarnings("unchecked")
    private List<ClinicalDocument> backfillProviderDetails(Long workerId, List<ClinicalDocument> documents) {
        List<ClinicalDocument> workerDocuments = clinicalDocumentRepository.findByWorkerId(workerId);
        Optional<Appointment> latestAppointment = appointmentRepository.findByWorkerId(workerId).stream()
                .filter(appointment -> appointment.getDoctorEmail() != null && !appointment.getDoctorEmail().isBlank())
                .max(Comparator.comparing(appointment -> appointment.getAppointmentAt() == null ? "" : appointment.getAppointmentAt()));
        try {
            List<?> doctors = restTemplate.getForObject(userServiceUrl + "/api/admin/doctors", List.class);
            for (ClinicalDocument document : documents) {
                ClinicalDocument sameVisitProvider = workerDocuments.stream().filter(other ->
                        other.getId() != null && !other.getId().equals(document.getId())
                                && Objects.equals(other.getDate(), document.getDate())
                                && ((other.getDoctorEmail() != null && !other.getDoctorEmail().isBlank())
                                || (other.getDoctorName() != null && !other.getDoctorName().isBlank()))).findFirst().orElse(null);
                if (sameVisitProvider != null && (document.getDoctorName() == null || document.getDoctorName().isBlank())) {
                    document.setDoctorName(sameVisitProvider.getDoctorName());
                    document.setDoctorEmail(sameVisitProvider.getDoctorEmail());
                    document.setHospitalName(sameVisitProvider.getHospitalName());
                    document.setHospitalAddress(sameVisitProvider.getHospitalAddress());
                    clinicalDocumentRepository.save(document);
                    continue;
                }
                Map<String, Object> doctor = findDocumentDoctor(doctors, document,
                        sameVisitProvider == null ? latestAppointment.map(Appointment::getDoctorEmail).orElse(null) : sameVisitProvider.getDoctorEmail(),
                        sameVisitProvider == null ? null : sameVisitProvider.getDoctorName());
                if (doctor == null) continue;
                boolean changed = false;
                if (document.getDoctorName() == null || document.getDoctorName().isBlank() || "Doctor".equalsIgnoreCase(document.getDoctorName())) { document.setDoctorName(String.valueOf(doctor.get("fullName"))); changed = true; }
                if (document.getDoctorEmail() == null || document.getDoctorEmail().isBlank()) { document.setDoctorEmail(String.valueOf(doctor.get("email"))); changed = true; }
                if (document.getHospitalName() == null || document.getHospitalName().isBlank() || "Not provided".equalsIgnoreCase(document.getHospitalName())) { document.setHospitalName(String.valueOf(doctor.getOrDefault("hospital", ""))); changed = true; }
                if (document.getHospitalAddress() == null || document.getHospitalAddress().isBlank() || "Not provided".equalsIgnoreCase(document.getHospitalAddress())) { document.setHospitalAddress(hospitalAddress(doctor)); changed = true; }
                if (changed) clinicalDocumentRepository.save(document);
            }
        } catch (Exception ignored) { }
        return documents;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> findDocumentDoctor(List<?> doctors, ClinicalDocument document, String appointmentDoctorEmail, String sameVisitDoctorName) {
        if (doctors == null) return null;
        return doctors.stream().filter(Map.class::isInstance).map(item -> (Map<String, Object>) item).filter(doctor ->
                (document.getDoctorEmail() != null && document.getDoctorEmail().equalsIgnoreCase(String.valueOf(doctor.get("email"))))
                        || (document.getDoctorName() != null && document.getDoctorName().equalsIgnoreCase(String.valueOf(doctor.get("fullName"))))
                        || (sameVisitDoctorName != null && sameVisitDoctorName.equalsIgnoreCase(String.valueOf(doctor.get("fullName"))))
                        || (appointmentDoctorEmail != null && appointmentDoctorEmail.equalsIgnoreCase(String.valueOf(doctor.get("email"))))
        ).findFirst().orElse(null);
    }

    private String hospitalAddress(Map<String, Object> doctor) {
        Object configured = doctor.get("hospitalAddress");
        if (configured != null && !configured.toString().isBlank()) return configured.toString();
        String hospital = String.valueOf(doctor.getOrDefault("hospital", ""));
        int comma = hospital.indexOf(',');
        return comma >= 0 ? hospital.substring(comma + 1).trim() : hospital;
    }

    @GetMapping("/internal/stats")
    public ResponseEntity<?> getInternalStats() {
        try {
            long appointments = appointmentRepository.count();
            long prescriptions = clinicalDocumentRepository.countByType("PRESCRIPTION");
            return ResponseEntity.ok(Map.of(
                "appointments", appointments,
                "prescriptions", prescriptions
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }
}
