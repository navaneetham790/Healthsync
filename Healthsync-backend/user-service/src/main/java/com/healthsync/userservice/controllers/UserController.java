package com.healthsync.userservice.controllers;

import com.healthsync.userservice.entities.AuditLog;
import com.healthsync.userservice.entities.Doctor;
import com.healthsync.userservice.entities.DoctorApplication;
import com.healthsync.userservice.entities.Setting;
import com.healthsync.userservice.entities.Worker;
import com.healthsync.userservice.repositories.AuditLogRepository;
import com.healthsync.userservice.repositories.DoctorRepository;
import com.healthsync.userservice.repositories.DoctorApplicationRepository;
import com.healthsync.userservice.repositories.SettingRepository;
import com.healthsync.userservice.repositories.WorkerRepository;
import com.healthsync.userservice.services.EmailService;
import com.healthsync.userservice.services.EmailOtpService;
import com.healthsync.userservice.services.PhoneOtpService;
import com.healthsync.userservice.utils.JwtUtil;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class UserController {

    private static final long TWO_FACTOR_EXPIRY_MS = 5 * 60 * 1000L;
    private final Map<String, PendingLogin> pendingTwoFactorLogins = new java.util.concurrent.ConcurrentHashMap<>();

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private DoctorApplicationRepository doctorApplicationRepository;

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private SettingRepository settingRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PhoneOtpService phoneOtpService;

    @Autowired
    private EmailOtpService emailOtpService;

    @Value("${health.service.url:http://localhost:8083}")
    private String healthServiceUrl;

    @Value("${app.doctor-application-url:http://localhost:5173/doctor-verification}")
    private String doctorApplicationUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // Initialize only system settings on startup (no dummy data)
    @PostConstruct
    public void initData() {
        if (settingRepository.count() == 0) {
            Setting defaultSetting = new Setting();
            settingRepository.save(defaultSetting);
        }
        settingRepository.findById(1L).ifPresent(setting -> {
            if ("navaneetham790@gmail.com".equalsIgnoreCase(setting.getEmail()) || "admin@healthsync.com".equalsIgnoreCase(setting.getEmail())) {
                setting.setEmail("healthsyncproject3502@gmail.com");
                settingRepository.save(setting);
            }
        });
        doctorRepository.findAll().forEach(doctor -> migratePasswordIfNeeded(doctor.getPassword(), doctor::setPassword, () -> doctorRepository.save(doctor)));
        workerRepository.findAll().forEach(worker -> migratePasswordIfNeeded(worker.getPassword(), worker::setPassword, () -> workerRepository.save(worker)));
        
        doctorRepository.findByEmail("bavanasrivelan@gmail.com").ifPresent(doctor -> {
            doctor.setEmail("717824f108@gmail.com");
            doctorRepository.save(doctor);
        });

        // User requested clean database with 0 workers and 0 doctors
        doctorRepository.deleteAll();
        workerRepository.deleteAll();

    }

    private boolean passwordMatches(String rawPassword, String storedPassword) {
        return storedPassword != null && (storedPassword.startsWith("$2")
                ? passwordEncoder.matches(rawPassword, storedPassword)
                : rawPassword.equals(storedPassword));
    }

    private void migratePasswordIfNeeded(String storedPassword, java.util.function.Consumer<String> setter, Runnable save) {
        if (storedPassword != null && !storedPassword.startsWith("$2")) {
            setter.accept(passwordEncoder.encode(storedPassword));
            save.run();
        }
    }

    private ResponseEntity<?> completeLogin(String email, String role, Long userId, String fullName, String workerCode) {
        String token = jwtUtil.generateToken(email, role, userId);
        saveAuditLog(role.substring(0, 1).toUpperCase() + role.substring(1) + " Logged In", fullName + " successfully signed in", role);
        Map<String, Object> user = new LinkedHashMap<>();
        user.put("id", userId);
        user.put("email", email);
        user.put("fullName", fullName);
        if (workerCode != null) user.put("workerCode", workerCode);
        return ResponseEntity.ok(Map.of("token", token, "role", role, "user", user));
    }

    private ResponseEntity<?> requireTwoFactor(String email, String role, Long userId, String fullName, String workerCode) {
        try {
            emailOtpService.sendOtpForLoginAsync(email);
            String loginToken = UUID.randomUUID().toString();
            pendingTwoFactorLogins.put(loginToken, new PendingLogin(email, role, userId, fullName, workerCode, System.currentTimeMillis() + TWO_FACTOR_EXPIRY_MS));
            return ResponseEntity.ok(Map.of("twoFactorRequired", true, "loginToken", loginToken, "email", email, "message", "A 6-digit verification code was sent to your registered email."));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("message", "Unable to send the two-factor code. Please try again."));
        }
    }

    private record PendingLogin(String email, String role, Long userId, String fullName, String workerCode, long expiresAt) {}

    // ==========================================
    // AUTHENTICATION ENDPOINTS
    // ==========================================

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required."));
        }

        email = email.trim().toLowerCase();

        // 1. Check Admin
        String adminEmail = settingRepository.findById(1L).map(Setting::getEmail).orElse("healthsyncproject3502@gmail.com").trim().toLowerCase();
        if (email.equals(adminEmail) && password.equals("admin123")) {
            if (settingRepository.findById(1L).map(Setting::getTwoFactor).orElse(false)) return requireTwoFactor(email, "admin", 999L, "Administrator", null);
            return completeLogin(email, "admin", 999L, "Administrator", null);
        }

        // 2. Check Doctor
        Optional<Doctor> doctorOpt = doctorRepository.findByEmail(email);
        if (doctorOpt.isPresent() && passwordMatches(password, doctorOpt.get().getPassword())) {
            Doctor d = doctorOpt.get();
            if (Boolean.TRUE.equals(d.getTwoFactor())) return requireTwoFactor(email, "doctor", d.getId(), d.getFullName(), null);
            return completeLogin(email, "doctor", d.getId(), d.getFullName(), null);
        }

        // 3. Check Worker
        Optional<Worker> workerOpt = workerRepository.findByEmail(email);
        if (workerOpt.isPresent()) {
            Worker w = workerOpt.get();
            if (passwordMatches(password, w.getPassword())) {
                if (Boolean.TRUE.equals(w.getTwoFactor())) return requireTwoFactor(email, "worker", w.getId(), w.getFullName(), w.getWorkerCode());
                return completeLogin(email, "worker", w.getId(), w.getFullName(), w.getWorkerCode());
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password."));
    }

    @PostMapping("/auth/admin/login")
    public ResponseEntity<?> adminLogin(@RequestBody Map<String, String> payload) {
        return login(payload);
    }

    @PostMapping("/auth/doctor/login")
    public ResponseEntity<?> doctorLogin(@RequestBody Map<String, String> payload) {
        return login(payload);
    }

    @PostMapping("/auth/worker/login")
    public ResponseEntity<?> workerLogin(@RequestBody Map<String, String> payload) {
        return login(payload);
    }

    @PostMapping("/auth/2fa/verify")
    public ResponseEntity<?> verifyTwoFactorLogin(@RequestBody Map<String, String> payload) {
        String loginToken = payload.get("loginToken");
        PendingLogin pending = pendingTwoFactorLogins.get(loginToken);
        if (pending == null || pending.expiresAt < System.currentTimeMillis()) {
            if (loginToken != null) pendingTwoFactorLogins.remove(loginToken);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Your login verification has expired. Please sign in again."));
        }
        try {
            emailOtpService.verifyOtp(pending.email, payload.get("otp"));
            pendingTwoFactorLogins.remove(loginToken);
            return completeLogin(pending.email, pending.role, pending.userId, pending.fullName, pending.workerCode);
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }

    @PostMapping("/auth/phone-otp/send")
    public ResponseEntity<?> sendPhoneOtp(@RequestBody Map<String, String> payload) {
        try {
            phoneOtpService.sendOtp(payload.get("phone"));
            return ResponseEntity.ok(Map.of("message", "OTP sent to the entered mobile number."));
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }

    @PostMapping("/auth/email-otp/send")
    public ResponseEntity<?> sendEmailOtp(@RequestBody Map<String, String> payload) {
        try {
            String code = emailOtpService.sendOtp(payload.get("email"));
            return ResponseEntity.ok(Map.of(
                "message", "Verification code sent to the entered email address.",
                "code", code
            ));
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }

    @PostMapping("/auth/phone-otp/verify")
    public ResponseEntity<?> verifyPhoneOtp(@RequestBody Map<String, String> payload) {
        try {
            String token = phoneOtpService.verifyOtp(payload.get("phone"), payload.get("otp"));
            return ResponseEntity.ok(Map.of("message", "Mobile number verified successfully.", "verificationToken", token));
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }

    @PostMapping("/auth/email-otp/verify")
    public ResponseEntity<?> verifyEmailOtp(@RequestBody Map<String, String> payload) {
        try {
            String token = emailOtpService.verifyOtp(payload.get("email"), payload.get("otp"));
            return ResponseEntity.ok(Map.of("message", "Email verified successfully.", "verificationToken", token));
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }

    private boolean verifiedPhone(String phone, Object token) {
        return phoneOtpService.isVerified(phone, token == null ? null : token.toString());
    }

    private boolean verifiedEmail(String email, Object token) {
        return emailOtpService.isVerified(email, token == null ? null : token.toString());
    }

    @PostMapping("/auth/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required."));
        }
        email = email.trim().toLowerCase();
        final String normalizedEmail = email;
        
        boolean exists = false;
        
        if (settingRepository.findById(1L).map(Setting::getEmail).map(value -> value.equalsIgnoreCase(normalizedEmail)).orElse(false)) {
            exists = true;
        } else if (doctorRepository.findByEmail(email).isPresent()) {
            exists = true;
        } else if (workerRepository.findByEmail(email).isPresent()) {
            exists = true;
        }
        
        if (!exists) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Email address not registered."));
        }
        
        try {
            // Send the tokenized link only to the registered email that requested it.
            emailService.sendPasswordResetEmail(email, jwtUtil.generatePasswordResetToken(email));
        } catch (Exception exception) {
            exception.printStackTrace();
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", "Unable to send the password reset email. Please try again later."));
        }
        saveAuditLog("Password Reset Requested", "Reset link requested for " + email, "system");
        
        return ResponseEntity.ok(Map.of("message", "Password reset link sent to " + email));
    }

    @PostMapping("/auth/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload) {
        String resetToken = payload.get("token");
        String newPassword = payload.get("newPassword");
        if (resetToken == null || newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "A valid reset link and a password of at least 6 characters are required."));
        }

        try {
            if (!jwtUtil.isPasswordResetToken(resetToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "This reset link is invalid."));
            }
            String email = jwtUtil.extractEmail(resetToken).trim().toLowerCase();
            Optional<Doctor> doctor = doctorRepository.findByEmail(email);
            if (doctor.isPresent()) {
                doctor.get().setPassword(passwordEncoder.encode(newPassword));
                doctorRepository.save(doctor.get());
            } else {
                Optional<Worker> worker = workerRepository.findByEmail(email);
                if (worker.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Account not found."));
                }
                worker.get().setPassword(passwordEncoder.encode(newPassword));
                workerRepository.save(worker.get());
            }
            saveAuditLog("Password Reset Completed", "Password reset completed for " + email, "system");
            return ResponseEntity.ok(Map.of("message", "Password updated successfully. You can now sign in."));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "This reset link is invalid or has expired."));
        }
    }

    // ==========================================
    // ADMIN ENDPOINTS
    // ==========================================

    @PostMapping("/admin/doctor-applications/invite")
    public ResponseEntity<?> inviteDoctorApplication(@RequestBody Map<String, String> payload) {
        String email = Optional.ofNullable(payload.get("email")).orElse("").trim().toLowerCase();
        String name = Optional.ofNullable(payload.get("fullName")).orElse("").trim();
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) return ResponseEntity.badRequest().body(Map.of("message", "Enter a valid doctor email address."));
        if (doctorRepository.findByEmail(email).isPresent()) return ResponseEntity.badRequest().body(Map.of("message", "This doctor already has a HealthSync account."));
        DoctorApplication application = doctorApplicationRepository.findByEmailIgnoreCase(email).orElseGet(DoctorApplication::new);
        application.setEmail(email); application.setFullName(name); application.setInvitationToken(UUID.randomUUID().toString());
        application.setStatus("INVITED"); application.setRejectionReason(null); application.setInvitedAt(Instant.now()); application.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
        doctorApplicationRepository.save(application);
        String link = doctorApplicationUrl + "?token=" + application.getInvitationToken();
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try { emailService.sendDoctorApplicationInvitation(email, name, link); }
            catch (Exception ignored) { /* invitation is retained and can be resent by the admin */ }
        });
        saveAuditLog("Doctor Verification Invited", "Sent verification form invitation to " + email, "admin");
        return ResponseEntity.ok(Map.of("message", "Verification form invitation sent successfully.", "expiresAt", application.getExpiresAt()));
    }

    @GetMapping("/doctor-applications/form")
    public ResponseEntity<?> getDoctorApplicationForm(@RequestParam String token) {
        Optional<DoctorApplication> application = doctorApplicationRepository.findByInvitationToken(token);
        if (application.isEmpty() || application.get().getExpiresAt() == null || application.get().getExpiresAt().isBefore(Instant.now())) return ResponseEntity.status(HttpStatus.GONE).body(Map.of("message", "This verification link is invalid or has expired."));
        DoctorApplication a = application.get();
        if ("APPROVED".equals(a.getStatus())) return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "This doctor application has already been approved."));
        return ResponseEntity.ok(Map.of("email", a.getEmail(), "fullName", Optional.ofNullable(a.getFullName()).orElse(""), "status", a.getStatus()));
    }

    @PostMapping("/doctor-applications/submit")
    public ResponseEntity<?> submitDoctorApplication(@RequestBody Map<String, String> payload) {
        Optional<DoctorApplication> application = doctorApplicationRepository.findByInvitationToken(payload.get("token"));
        if (application.isEmpty() || application.get().getExpiresAt() == null || application.get().getExpiresAt().isBefore(Instant.now())) return ResponseEntity.status(HttpStatus.GONE).body(Map.of("message", "This verification link is invalid or has expired."));
        DoctorApplication a = application.get();
        String[] required = {"fullName", "phone", "medicalRegistrationNumber", "medicalCouncil", "registrationDate", "registrationStatus", "medicalDegree", "specialization", "hospital", "hospitalAddress", "experience", "password", "registrationCertificateData", "governmentIdData"};
        for (String field : required) if (payload.get(field) == null || payload.get(field).trim().isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Please complete all required verification fields and upload both documents."));
        if (payload.get("password").length() < 6) return ResponseEntity.badRequest().body(Map.of("message", "Password must contain at least 6 characters."));
        boolean registrationUsed = doctorApplicationRepository.findAll().stream().anyMatch(other -> !Objects.equals(other.getId(), a.getId()) && payload.get("medicalRegistrationNumber").trim().equalsIgnoreCase(other.getMedicalRegistrationNumber()));
        if (registrationUsed) return ResponseEntity.badRequest().body(Map.of("message", "This medical registration number has already been submitted."));
        a.setFullName(payload.get("fullName").trim()); a.setPhone(payload.get("phone").trim()); a.setMedicalRegistrationNumber(payload.get("medicalRegistrationNumber").trim());
        a.setMedicalCouncil(payload.get("medicalCouncil").trim()); a.setRegistrationDate(payload.get("registrationDate")); a.setRegistrationStatus(payload.get("registrationStatus").trim());
        a.setMedicalDegree(payload.get("medicalDegree").trim()); a.setSpecialization(payload.get("specialization").trim()); a.setHospital(payload.get("hospital").trim()); a.setHospitalAddress(payload.get("hospitalAddress").trim()); a.setExperience(payload.get("experience").trim());
        a.setPasswordHash(passwordEncoder.encode(payload.get("password"))); a.setRegistrationCertificateData(payload.get("registrationCertificateData")); a.setRegistrationCertificateName(payload.getOrDefault("registrationCertificateName", "registration-certificate")); a.setRegistrationCertificateMimeType(payload.getOrDefault("registrationCertificateMimeType", "application/octet-stream"));
        a.setGovernmentIdData(payload.get("governmentIdData")); a.setGovernmentIdName(payload.getOrDefault("governmentIdName", "government-id")); a.setGovernmentIdMimeType(payload.getOrDefault("governmentIdMimeType", "application/octet-stream"));
        a.setStatus("SUBMITTED"); a.setRejectionReason(null); a.setSubmittedAt(Instant.now()); doctorApplicationRepository.save(a);
        settingRepository.findById(1L).ifPresent(setting -> java.util.concurrent.CompletableFuture.runAsync(() -> { try { emailService.sendDoctorApplicationSubmitted(setting.getEmail(), a.getFullName(), a.getEmail(), a.getMedicalRegistrationNumber()); } catch (Exception ignored) {} }));
        saveAuditLog("Doctor Verification Submitted", "Doctor application submitted by " + a.getEmail(), "doctor-application");
        return ResponseEntity.ok(Map.of("message", "Your verification form was submitted successfully. HealthSync Administration will review it shortly."));
    }

    @GetMapping("/admin/doctor-applications")
    public ResponseEntity<?> getDoctorApplications() {
        Instant now = Instant.now();
        // Invitations that were not completed within seven days are removed;
        // they must not remain visible in the administrator request list.
        List<DoctorApplication> expiredInvitations = doctorApplicationRepository.findAll().stream()
                .filter(application -> "INVITED".equals(application.getStatus()) && application.getExpiresAt() != null && application.getExpiresAt().isBefore(now))
                .toList();
        if (!expiredInvitations.isEmpty()) doctorApplicationRepository.deleteAll(expiredInvitations);
        return ResponseEntity.ok(doctorApplicationRepository.findAll().stream()
                .sorted(Comparator.comparing(DoctorApplication::getInvitedAt).reversed())
                .map(this::doctorApplicationSummary).toList());
    }

    @GetMapping("/admin/doctor-applications/{id}/documents/{documentType}")
    public ResponseEntity<?> getDoctorApplicationDocument(@PathVariable Long id, @PathVariable String documentType) {
        Optional<DoctorApplication> application = doctorApplicationRepository.findById(id); if (application.isEmpty()) return ResponseEntity.notFound().build();
        DoctorApplication a = application.get(); boolean certificate = "certificate".equals(documentType);
        String data = certificate ? a.getRegistrationCertificateData() : a.getGovernmentIdData(); String type = certificate ? a.getRegistrationCertificateMimeType() : a.getGovernmentIdMimeType(); String name = certificate ? a.getRegistrationCertificateName() : a.getGovernmentIdName();
        if (data == null || data.isBlank()) return ResponseEntity.notFound().build();
        try { byte[] bytes = Base64.getDecoder().decode(data.contains(",") ? data.substring(data.indexOf(',') + 1) : data); return ResponseEntity.ok().contentType(MediaType.parseMediaType(type)).header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + name.replace("\"", "") + "\"").body(bytes); }
        catch (IllegalArgumentException e) { return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Stored document is invalid.")); }
    }

    @PostMapping("/admin/doctor-applications/{id}/approve")
    public ResponseEntity<?> approveDoctorApplication(@PathVariable Long id) {
        Optional<DoctorApplication> application = doctorApplicationRepository.findById(id); if (application.isEmpty()) return ResponseEntity.notFound().build(); DoctorApplication a = application.get();
        if (!"SUBMITTED".equals(a.getStatus())) return ResponseEntity.badRequest().body(Map.of("message", "Only submitted applications can be approved."));
        if (doctorRepository.findByEmail(a.getEmail()).isPresent()) return ResponseEntity.badRequest().body(Map.of("message", "A doctor account already exists for this email."));
        a.setStatus("APPROVED"); a.setReviewedAt(Instant.now()); doctorApplicationRepository.save(a);
        java.util.concurrent.CompletableFuture.runAsync(() -> { try { emailService.sendDoctorApplicationDecision(a.getEmail(), a.getFullName(), true, ""); } catch (Exception ignored) {} });
        saveAuditLog("Doctor Verification Approved", "Approved doctor application: " + a.getFullName(), "admin"); return ResponseEntity.ok(Map.of("message", "Doctor approved. Add the doctor manually from the submitted application details."));
    }

    @PostMapping("/admin/doctor-applications/{id}/reject")
    public ResponseEntity<?> rejectDoctorApplication(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Optional<DoctorApplication> application = doctorApplicationRepository.findById(id); if (application.isEmpty()) return ResponseEntity.notFound().build(); DoctorApplication a = application.get(); String reason = Optional.ofNullable(payload.get("reason")).orElse("").trim();
        if (!"SUBMITTED".equals(a.getStatus())) return ResponseEntity.badRequest().body(Map.of("message", "Only submitted applications can be rejected.")); if (reason.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Enter the rejection reason."));
        a.setStatus("REJECTED"); a.setRejectionReason(reason); a.setReviewedAt(Instant.now()); doctorApplicationRepository.save(a);
        java.util.concurrent.CompletableFuture.runAsync(() -> { try { emailService.sendDoctorApplicationDecision(a.getEmail(), a.getFullName(), false, reason); } catch (Exception ignored) {} });
        saveAuditLog("Doctor Verification Rejected", "Rejected doctor application: " + a.getFullName(), "admin"); return ResponseEntity.ok(Map.of("message", "Rejection reason sent to the doctor."));
    }

    @DeleteMapping("/admin/doctor-applications/{id}")
    public ResponseEntity<?> cancelDoctorApplication(@PathVariable Long id) {
        Optional<DoctorApplication> application = doctorApplicationRepository.findById(id);
        if (application.isEmpty()) return ResponseEntity.notFound().build();
        DoctorApplication a = application.get();
        if (!"INVITED".equals(a.getStatus())) return ResponseEntity.badRequest().body(Map.of("message", "Only an unsubmitted invitation can be cancelled."));
        doctorApplicationRepository.delete(a);
        saveAuditLog("Doctor Verification Cancelled", "Cancelled verification invitation for " + a.getEmail(), "admin");
        return ResponseEntity.ok(Map.of("message", "Doctor verification invitation cancelled."));
    }

    // One-time cleanup for accounts created by the former approval flow.
    // It is intentionally restricted to an APPROVED application: the doctor
    // form remains available and no termination email is sent.
    @DeleteMapping("/admin/doctor-applications/{id}/uncreated-account")
    public ResponseEntity<?> removeLegacyUncreatedDoctor(@PathVariable Long id) {
        Optional<DoctorApplication> application = doctorApplicationRepository.findById(id);
        if (application.isEmpty() || !"APPROVED".equals(application.get().getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only an approved, uncreated application can be cleaned up."));
        }
        DoctorApplication a = application.get();
        doctorRepository.findByEmail(a.getEmail()).ifPresent(doctorRepository::delete);
        saveAuditLog("Legacy Doctor Account Removed", "Removed uncreated legacy doctor account for " + a.getEmail(), "admin");
        return ResponseEntity.ok(Map.of("message", "Legacy doctor account removed. The approved application was retained."));
    }

    private Map<String, Object> doctorApplicationSummary(DoctorApplication a) {
        Map<String, Object> data = new LinkedHashMap<>(); data.put("id", a.getId()); data.put("email", a.getEmail()); data.put("fullName", a.getFullName()); data.put("phone", a.getPhone()); data.put("medicalRegistrationNumber", a.getMedicalRegistrationNumber()); data.put("medicalCouncil", a.getMedicalCouncil()); data.put("medicalDegree", a.getMedicalDegree()); data.put("specialization", a.getSpecialization()); data.put("hospital", a.getHospital()); data.put("hospitalAddress", a.getHospitalAddress()); data.put("experience", a.getExperience()); data.put("status", a.getStatus()); data.put("rejectionReason", a.getRejectionReason()); data.put("invitedAt", a.getInvitedAt()); data.put("expiresAt", a.getExpiresAt()); data.put("submittedAt", a.getSubmittedAt()); return data;
    }

    @GetMapping("/admin/doctor-applications/{id}")
    public ResponseEntity<?> getDoctorApplication(@PathVariable Long id) {
        return doctorApplicationRepository.findById(id).<ResponseEntity<?>>map(a -> ResponseEntity.ok(doctorApplicationSummary(a))).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/admin/doctor")
    public ResponseEntity<?> createDoctor(@RequestBody Map<String, String> payload) {
        try {
            String fullName = payload.get("fullName");
            String email = payload.get("email").trim().toLowerCase();
            String password = payload.get("password");
            String phone = payload.get("phone");
            String specialization = payload.get("specialization");
            String hospital = payload.get("hospital");
            String hospitalAddress = payload.get("hospitalAddress");

            if (doctorRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Doctor email already registered."));
            }
            String applicationId = Optional.ofNullable(payload.get("applicationId")).orElse("").trim();
            DoctorApplication verifiedApplication = null;
            if (!applicationId.isEmpty()) {
                try { verifiedApplication = doctorApplicationRepository.findById(Long.valueOf(applicationId)).orElse(null); } catch (NumberFormatException ignored) { }
                if (verifiedApplication == null || !"APPROVED".equals(verifiedApplication.getStatus()) || !email.equalsIgnoreCase(verifiedApplication.getEmail()) || verifiedApplication.getPasswordHash() == null) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Use an approved doctor application to create this account."));
                }
            }
            if (verifiedApplication == null && !verifiedEmail(email, payload.get("emailVerificationToken"))) {
                return ResponseEntity.badRequest().body(Map.of("message", "Verify the doctor's email with the verification code before creating the account."));
            }

            Doctor d = new Doctor(fullName, email, verifiedApplication != null ? verifiedApplication.getPasswordHash() : passwordEncoder.encode(password), phone, specialization, hospital);
            d.setHospitalAddress(hospitalAddress);
            doctorRepository.save(d);
            if (verifiedApplication != null) { verifiedApplication.setStatus("ACCOUNT_CREATED"); doctorApplicationRepository.save(verifiedApplication); }

            saveAuditLog("Doctor Created", "Created doctor account: " + fullName, "admin");

            return ResponseEntity.ok(d);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/admin/doctors")
    public ResponseEntity<?> getDoctors(@RequestParam(value = "search", required = false) String search) {
        if (search != null && !search.trim().isEmpty()) {
            try {
                Optional<Doctor> doctorById = doctorRepository.findById(Long.parseLong(search.trim()));
                if (doctorById.isPresent()) return ResponseEntity.ok(List.of(doctorById.get()));
            } catch (NumberFormatException ignored) {
                // A non-numeric value is searched as a doctor name below.
            }
            return ResponseEntity.ok(doctorRepository.findByFullNameContainingIgnoreCase(search));
        }
        return ResponseEntity.ok(doctorRepository.findAll());
    }

    @PutMapping("/admin/doctors/{id}")
    public ResponseEntity<?> updateDoctor(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Optional<Doctor> opt = doctorRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Doctor not found."));
        }
        Doctor d = opt.get();
        if (payload.containsKey("fullName")) d.setFullName(payload.get("fullName"));
        if (payload.containsKey("email")) d.setEmail(payload.get("email").trim().toLowerCase());
        if (payload.containsKey("phone") && !Objects.equals(payload.get("phone"), d.getPhone())) {
            if (!verifiedPhone(payload.get("phone"), payload.get("phoneVerificationToken"))) return ResponseEntity.badRequest().body(Map.of("message", "Verify the new mobile number with OTP first."));
            d.setPhone(payload.get("phone"));
        }
        if (payload.containsKey("specialization")) d.setSpecialization(payload.get("specialization"));
        if (payload.containsKey("hospital")) d.setHospital(payload.get("hospital"));
        if (payload.containsKey("hospitalAddress")) d.setHospitalAddress(payload.get("hospitalAddress"));
        
        doctorRepository.save(d);
        saveAuditLog("Doctor Updated", "Updated doctor account: " + d.getFullName(), "admin");
        return ResponseEntity.ok(d);
    }

    @DeleteMapping("/admin/doctors/{id}")
    public ResponseEntity<?> deleteDoctor(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        Optional<Doctor> opt = doctorRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Doctor not found."));
        }
        Doctor d = opt.get();
        String adminMessage = payload == null ? "" : payload.getOrDefault("message", "").trim();
        if (adminMessage.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Enter a termination message before deleting the doctor."));
        }
        try {
            emailService.sendTerminationEmail(d.getEmail(), d.getFullName(), adminMessage);
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", "Unable to send the termination email. The doctor was not deleted."));
        }
        doctorRepository.delete(d);
        saveAuditLog("Doctor Deleted", "Deleted doctor account: Dr. " + d.getFullName(), "admin");
        return ResponseEntity.ok(Map.of("message", "Doctor deleted successfully."));
    }

    @PostMapping("/admin/workers")
    public ResponseEntity<?> createWorkerFromAdmin(@RequestBody Map<String, Object> payload) {
        return createWorker(null, payload);
    }

    @GetMapping("/admin/workers")
    public ResponseEntity<?> getWorkers() {
        return ResponseEntity.ok(workerRepository.findAll());
    }

    @PutMapping("/admin/profile")
    public ResponseEntity<?> updateAdminProfile(@RequestBody Map<String, String> payload) {
        Optional<Setting> opt = settingRepository.findById(1L);
        if (opt.isPresent()) {
            Setting s = opt.get();
            if (payload.containsKey("name")) s.setName(payload.get("name"));
            if (payload.containsKey("email")) s.setEmail(payload.get("email"));
        if (payload.containsKey("phone") && !Objects.equals(payload.get("phone"), s.getPhone())) {
            if (!verifiedPhone(payload.get("phone"), payload.get("phoneVerificationToken"))) return ResponseEntity.badRequest().body(Map.of("message", "Verify the new mobile number with OTP first."));
            s.setPhone(payload.get("phone"));
        }
            settingRepository.save(s);
        }
        saveAuditLog("Admin Profile Updated", "Admin updated profile contact information", "admin");
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully."));
    }

    @GetMapping("/admin/settings")
    public ResponseEntity<?> getSettings() {
        Optional<Setting> opt = settingRepository.findById(1L);
        return ResponseEntity.ok(opt.orElseGet(Setting::new));
    }

    @PutMapping("/admin/settings")
    public ResponseEntity<?> updateSettings(@RequestBody Map<String, Object> payload) {
        Optional<Setting> opt = settingRepository.findById(1L);
        Setting s = opt.orElseGet(Setting::new);
        
        if (payload.containsKey("name")) s.setName((String) payload.get("name"));
        if (payload.containsKey("email")) s.setEmail((String) payload.get("email"));
        if (payload.containsKey("phone") && !Objects.equals((String) payload.get("phone"), s.getPhone())) {
            if (!verifiedPhone((String) payload.get("phone"), payload.get("phoneVerificationToken"))) return ResponseEntity.badRequest().body(Map.of("message", "Verify the new mobile number with OTP first."));
            s.setPhone((String) payload.get("phone"));
        }
        if (payload.containsKey("profilePicture")) s.setProfilePicture((String) payload.get("profilePicture"));
        if (payload.containsKey("twoFactor")) s.setTwoFactor((Boolean) payload.get("twoFactor"));
        if (payload.containsKey("emailNotifications")) s.setEmailNotifications((Boolean) payload.get("emailNotifications"));
        if (payload.containsKey("pushNotifications")) s.setPushNotifications((Boolean) payload.get("pushNotifications"));
        if (payload.containsKey("smsNotifications")) s.setSmsNotifications((Boolean) payload.get("smsNotifications"));
        if (payload.containsKey("theme")) s.setTheme((String) payload.get("theme"));
        if (payload.containsKey("language")) s.setLanguage((String) payload.get("language"));
        if (payload.containsKey("timeZone")) s.setTimeZone((String) payload.get("timeZone"));
        if (payload.containsKey("privacyMode")) s.setPrivacyMode((Boolean) payload.get("privacyMode"));
        
        settingRepository.save(s);
        saveAuditLog("Settings Updated", "Admin settings updated", "admin");
        return ResponseEntity.ok(s);
    }

    @PostMapping("/admin/sessions/logout-all")
    public ResponseEntity<?> logoutAll() {
        Optional<Setting> opt = settingRepository.findById(1L);
        if (opt.isPresent()) {
            Setting s = opt.get();
            s.setActiveSessions(1);
            settingRepository.save(s);
        }
        saveAuditLog("Sessions Cleared", "Logged out all other active sessions", "admin");
        return ResponseEntity.ok(Map.of("message", "Logged out from all other sessions."));
    }

    @GetMapping("/admin/auditlogs")
    public ResponseEntity<?> getAuditLogs() {
        List<AuditLog> logs = auditLogRepository.findAll();
        Collections.reverse(logs);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/admin/clear-all")
    public ResponseEntity<?> clearAllData() {
        doctorRepository.deleteAll();
        workerRepository.deleteAll();
        return ResponseEntity.ok(Map.of("message", "All doctors and workers deleted. Counts are now 0 and 0."));
    }

    @GetMapping("/admin/analytics")
    public ResponseEntity<?> getAnalytics() {
        long docCount = doctorRepository.count();
        long workerCount = workerRepository.count();
        long auditCount = auditLogRepository.count();

        // Monthly registration data
        List<Map<String, Object>> monthlyData = new ArrayList<>();
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        java.time.LocalDate now = java.time.LocalDate.now();
        
        List<Worker> allWorkers = workerRepository.findAll();
        List<Doctor> allDoctors = doctorRepository.findAll();
        
        for (int i = 5; i >= 0; i--) {
            java.time.LocalDate targetMonth = now.minusMonths(i);
            int m = targetMonth.getMonthValue() - 1;
            int count = 0;
            
            for (Worker w : allWorkers) {
                java.time.LocalDateTime dt = w.getCreatedAt();
                if (dt != null && dt.getYear() == targetMonth.getYear() && dt.getMonthValue() == targetMonth.getMonthValue()) {
                    count++;
                }
            }
            for (Doctor d : allDoctors) {
                java.time.LocalDateTime dt = d.getCreatedAt();
                if (dt != null && dt.getYear() == targetMonth.getYear() && dt.getMonthValue() == targetMonth.getMonthValue()) {
                    count++;
                }
            }
            
            Map<String, Object> entry = new HashMap<>();
            entry.put("month", months[m]);
            entry.put("count", count);
            monthlyData.add(entry);
        }

        long lowCount = workerRepository.countByRiskLevelIgnoreCase("LOW");
        long mediumCount = workerRepository.countByRiskLevelIgnoreCase("MEDIUM");
        long highCount = workerRepository.countByRiskLevelIgnoreCase("HIGH");

        List<Map<String, Object>> riskData = List.of(
            Map.of("riskLevel", "LOW",    "count", lowCount),
            Map.of("riskLevel", "MEDIUM", "count", mediumCount),
            Map.of("riskLevel", "HIGH",   "count", highCount)
        );

        long appointments = 0;
        long prescriptions = 0;
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            Map<?, ?> stats = restTemplate.getForObject("http://localhost:8083/api/internal/stats", Map.class);
            if (stats != null) {
                if (stats.get("appointments") != null) {
                    appointments = ((Number) stats.get("appointments")).longValue();
                }
                if (stats.get("prescriptions") != null) {
                    prescriptions = ((Number) stats.get("prescriptions")).longValue();
                }
            }
        } catch (Exception e) {
            System.err.println("[WARN] Failed to fetch stats from health-service: " + e.getMessage());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalDoctors", docCount);
        result.put("totalWorkers", workerCount);
        result.put("appointments", appointments);
        result.put("prescriptions", prescriptions);
        result.put("monthlyRegistrations", monthlyData);
        result.put("riskOverview", riskData);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/admin/profile")
    public ResponseEntity<?> getAdminProfile() {
        Optional<Setting> opt = settingRepository.findById(1L);
        Setting s = opt.orElseGet(Setting::new);
        Map<String, Object> profile = new HashMap<>();
        profile.put("name", s.getName() != null ? s.getName() : "Administrator");
        profile.put("email", s.getEmail() != null ? s.getEmail() : "healthsyncproject3502@gmail.com");
        profile.put("role", "Admin");
        profile.put("department", "HealthSync");
        profile.put("mobile", s.getPhone() != null ? s.getPhone() : "9876543210");
        profile.put("location", "Chennai");
        profile.put("experience", "5 Years");
        profile.put("status", "Active");
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/worker/doctors")
    public ResponseEntity<?> getAvailableDoctors() {
        return ResponseEntity.ok(doctorRepository.findAll());
    }

    @GetMapping("/admin/reports")
    public ResponseEntity<?> getReports() {
        long docCount = doctorRepository.count();
        long workerCount = workerRepository.count();
        
        List<Map<String, Object>> reports = new ArrayList<>();
        
        if (docCount > 0 || workerCount > 0) {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            String today = sdf.format(new Date());
            
            // Report 1: Worker Risk Distribution Report
            Map<String, Object> r1 = new HashMap<>();
            r1.put("id", "REP001");
            r1.put("type", "RISK_ANALYSIS");
            r1.put("title", "Worker Risk Distribution Report");
            r1.put("date", today);
            r1.put("status", "COMPLETED");
            
            long lowCount = workerRepository.countByRiskLevelIgnoreCase("LOW");
            long mediumCount = workerRepository.countByRiskLevelIgnoreCase("MEDIUM");
            long highCount = workerRepository.countByRiskLevelIgnoreCase("HIGH");
            r1.put("details", String.format("Total assessed: %d (Low: %d, Medium: %d, High: %d)", 
                (lowCount + mediumCount + highCount), lowCount, mediumCount, highCount));
            reports.add(r1);

            // Report 2: System Activity Summary
            Map<String, Object> r2 = new HashMap<>();
            r2.put("id", "REP002");
            r2.put("type", "SYSTEM_SUMMARY");
            r2.put("title", "HealthSync System Activity Summary");
            r2.put("date", today);
            r2.put("status", "COMPLETED");
            
            long appointments = 0;
            long prescriptions = 0;
            try {
                org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                Map<?, ?> stats = restTemplate.getForObject("http://localhost:8083/api/internal/stats", Map.class);
                if (stats != null) {
                    if (stats.get("appointments") != null) appointments = ((Number) stats.get("appointments")).longValue();
                    if (stats.get("prescriptions") != null) prescriptions = ((Number) stats.get("prescriptions")).longValue();
                }
            } catch (Exception e) {}
            r2.put("details", String.format("Registered Doctors: %d, Workers: %d, Appointments: %d, Prescriptions: %d", 
                docCount, workerCount, appointments, prescriptions));
            reports.add(r2);
        }
        
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/admin/reports/{id}/download")
    public ResponseEntity<byte[]> downloadReport(@PathVariable String id, @RequestParam(value = "format", defaultValue = "pdf") String format) {
        try {
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            com.lowagie.text.Document document = new com.lowagie.text.Document();
            com.lowagie.text.pdf.PdfWriter.getInstance(document, baos);
            
            document.open();
            
            // Add Title
            com.lowagie.text.Font titleFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 18);
            com.lowagie.text.Paragraph title = new com.lowagie.text.Paragraph("HealthSync Management System", titleFont);
            title.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);
            
            // Add Date
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            com.lowagie.text.Paragraph datePara = new com.lowagie.text.Paragraph("Report Generated On: " + sdf.format(new Date()));
            datePara.setSpacingAfter(10);
            document.add(datePara);

            // Report Details
            com.lowagie.text.Font headerFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 14);
            com.lowagie.text.Font bodyFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA, 12);
            
            if ("REP001".equals(id)) {
                com.lowagie.text.Paragraph reportTitle = new com.lowagie.text.Paragraph("Worker Risk Distribution Report", headerFont);
                reportTitle.setSpacingAfter(15);
                document.add(reportTitle);
                
                long low = workerRepository.countByRiskLevelIgnoreCase("LOW");
                long med = workerRepository.countByRiskLevelIgnoreCase("MEDIUM");
                long high = workerRepository.countByRiskLevelIgnoreCase("HIGH");
                long total = low + med + high;
                
                document.add(new com.lowagie.text.Paragraph("This report summarizes the health risk categorization of all registered migrant workers.", bodyFont));
                document.add(new com.lowagie.text.Paragraph("\nTotal Workers Assessed: " + total, bodyFont));
                document.add(new com.lowagie.text.Paragraph("- LOW Risk: " + low + " workers", bodyFont));
                document.add(new com.lowagie.text.Paragraph("- MEDIUM Risk: " + med + " workers", bodyFont));
                document.add(new com.lowagie.text.Paragraph("- HIGH Risk: " + high + " workers", bodyFont));
                
            } else if ("REP002".equals(id)) {
                com.lowagie.text.Paragraph reportTitle = new com.lowagie.text.Paragraph("HealthSync System Activity Summary", headerFont);
                reportTitle.setSpacingAfter(15);
                document.add(reportTitle);
                
                long docCount = doctorRepository.count();
                long workerCount = workerRepository.count();
                long appointments = 0;
                long prescriptions = 0;
                try {
                    org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
                    Map<?, ?> stats = restTemplate.getForObject("http://localhost:8083/api/internal/stats", Map.class);
                    if (stats != null) {
                        if (stats.get("appointments") != null) appointments = ((Number) stats.get("appointments")).longValue();
                        if (stats.get("prescriptions") != null) prescriptions = ((Number) stats.get("prescriptions")).longValue();
                    }
                } catch (Exception e) {}
                
                document.add(new com.lowagie.text.Paragraph("This report summarizes the overall activity and usage of the HealthSync platform.", bodyFont));
                document.add(new com.lowagie.text.Paragraph("\nSystem Statistics:", bodyFont));
                document.add(new com.lowagie.text.Paragraph("- Registered Doctors: " + docCount, bodyFont));
                document.add(new com.lowagie.text.Paragraph("- Registered Workers: " + workerCount, bodyFont));
                document.add(new com.lowagie.text.Paragraph("- Total Appointments booked: " + appointments, bodyFont));
                document.add(new com.lowagie.text.Paragraph("- Total Prescriptions generated: " + prescriptions, bodyFont));
            } else {
                com.lowagie.text.Paragraph reportTitle = new com.lowagie.text.Paragraph("Generic System Report: " + id, headerFont);
                reportTitle.setSpacingAfter(15);
                document.add(reportTitle);
                document.add(new com.lowagie.text.Paragraph("No report template defined for ID: " + id, bodyFont));
            }
            
            document.close();
            
            byte[] pdfBytes = baos.toByteArray();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("filename", "report-" + id + ".pdf");
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            String errorMsg = "Error generating PDF report: " + e.getMessage();
            return new ResponseEntity<>(errorMsg.getBytes(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ==========================================
    // DOCTOR ENDPOINTS
    // ==========================================

    @GetMapping("/doctor/profile")
    public ResponseEntity<?> getDoctorProfile(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.extractEmail(token);
        Optional<Doctor> d = doctorRepository.findByEmail(email);
        if (d.isPresent()) {
            return ResponseEntity.ok(d.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Profile not found."));
    }

    @PutMapping("/doctor/profile")
    public ResponseEntity<?> updateDoctorProfile(@RequestHeader("Authorization") String authHeader, @RequestBody Map<String, String> payload) {
        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.extractEmail(token);
        Optional<Doctor> opt = doctorRepository.findByEmail(email);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Profile not found."));
        }
        Doctor d = opt.get();
        if (payload.containsKey("fullName")) d.setFullName(payload.get("fullName"));
        if (payload.containsKey("phone") && !Objects.equals(payload.get("phone"), d.getPhone())) {
            if (!verifiedPhone(payload.get("phone"), payload.get("phoneVerificationToken"))) return ResponseEntity.badRequest().body(Map.of("message", "Verify the new mobile number with OTP first."));
            d.setPhone(payload.get("phone"));
        }
        if (payload.containsKey("specialization")) d.setSpecialization(payload.get("specialization"));
        if (payload.containsKey("hospital")) d.setHospital(payload.get("hospital"));
        
        doctorRepository.save(d);
        saveAuditLog("Doctor Profile Updated", "Dr. " + d.getFullName() + " updated their profile", "doctor");
        return ResponseEntity.ok(d);
    }

    @GetMapping("/doctor/settings")
    public ResponseEntity<?> getDoctorSettings(@RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.replace("Bearer ", ""));
        return doctorRepository.findByEmail(email)
                .<ResponseEntity<?>>map(doctor -> ResponseEntity.ok(doctorSettings(doctor)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Doctor account not found.")));
    }

    @PutMapping("/doctor/settings")
    public ResponseEntity<?> updateDoctorSettings(@RequestHeader("Authorization") String authHeader, @RequestBody Map<String, Object> payload) {
        String email = jwtUtil.extractEmail(authHeader.replace("Bearer ", ""));
        Optional<Doctor> doctor = doctorRepository.findByEmail(email);
        if (doctor.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Doctor account not found."));
        Doctor account = doctor.get();
        if (payload.containsKey("twoFactor")) account.setTwoFactor((Boolean) payload.get("twoFactor"));
        if (payload.containsKey("emailNotifications")) account.setEmailNotifications((Boolean) payload.get("emailNotifications"));
        if (payload.containsKey("pushNotifications")) account.setPushNotifications((Boolean) payload.get("pushNotifications"));
        if (payload.containsKey("theme")) account.setTheme((String) payload.get("theme"));
        if (payload.containsKey("language")) account.setLanguage((String) payload.get("language"));
        if (payload.containsKey("newPassword") && payload.get("newPassword") != null && !payload.get("newPassword").toString().isBlank()) account.setPassword(passwordEncoder.encode(payload.get("newPassword").toString()));
        doctorRepository.save(account);
        return ResponseEntity.ok(doctorSettings(account));
    }

    @GetMapping("/doctor/workers")
    public ResponseEntity<?> getDoctorWorkers(@RequestHeader("Authorization") String authHeader, @RequestParam(value = "search", required = false) String search) {
        String doctorEmail = requireDoctorEmail(authHeader);
        Set<Long> appointmentWorkerIds = doctorAppointmentWorkerIds(authHeader);
        List<Worker> permitted = workerRepository.findAll().stream()
                .filter(worker -> doctorEmail.equalsIgnoreCase(worker.getCreatedByDoctorEmail()) || appointmentWorkerIds.contains(worker.getId()))
                .toList();
        if (search == null || search.trim().isEmpty()) return ResponseEntity.ok(permitted);
        String term = search.trim().toLowerCase();
        return ResponseEntity.ok(permitted.stream().filter(worker ->
                String.valueOf(worker.getId()).equals(term)
                        || (worker.getWorkerCode() != null && worker.getWorkerCode().toLowerCase().contains(term))
                        || (worker.getFullName() != null && worker.getFullName().toLowerCase().contains(term)))
                .toList());
    }

    @SuppressWarnings("unchecked")
    private Set<Long> doctorAppointmentWorkerIds(String authHeader) {
        try {
            HttpHeaders headers = new HttpHeaders(); headers.set("Authorization", authHeader);
            ResponseEntity<List> response = restTemplate.exchange(healthServiceUrl + "/api/internal/doctor-patient-ids", org.springframework.http.HttpMethod.GET, new org.springframework.http.HttpEntity<>(headers), List.class);
            if (response.getBody() == null) return Set.of();
            Set<Long> workerIds = new HashSet<>();
            for (Object value : response.getBody()) workerIds.add(Long.valueOf(value.toString()));
            return workerIds;
        } catch (Exception ignored) {
            return Set.of();
        }
    }

    // All doctors may search this directory, but it deliberately excludes
    // contact and clinical details. Those remain appointment-protected.
    @GetMapping("/doctor/workers/directory")
    public ResponseEntity<?> getWorkerDirectory(@RequestHeader("Authorization") String authHeader, @RequestParam(value = "search", required = false) String search) {
        requireDoctorEmail(authHeader);
        String term = search == null ? "" : search.trim().toLowerCase();
        return ResponseEntity.ok(workerRepository.findAll().stream()
                .filter(worker -> term.isEmpty()
                        || String.valueOf(worker.getId()).equals(term)
                        || (worker.getWorkerCode() != null && worker.getWorkerCode().toLowerCase().contains(term))
                        || (worker.getFullName() != null && worker.getFullName().toLowerCase().contains(term)))
                .map(worker -> {
                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("id", worker.getId());
                    result.put("workerCode", worker.getWorkerCode());
                    result.put("fullName", worker.getFullName());
                    result.put("age", worker.getAge());
                    result.put("riskLevel", worker.getRiskLevel());
                    return result;
                }).toList());
    }

    @PostMapping("/doctor/workers")
    public ResponseEntity<?> createWorker(@RequestHeader(value = "Authorization", required = false) String authHeader, @RequestBody Map<String, Object> payload) {
        try {
            String fullName = (String) payload.get("fullName");
            String email = (String) payload.get("email");
            String password = (String) payload.get("password");
            String phone = (String) payload.get("phone");
            String workerCode = (String) payload.get("workerCode");
            Integer age = payload.get("age") != null ? ((Number) payload.get("age")).intValue() : 30;
            String diseases = (String) payload.get("diseases");
            String healthHistory = (String) payload.get("healthHistory");

            if (workerRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Worker email already registered."));
            }
            if (workerRepository.findByWorkerCode(workerCode).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Worker Code (ID) already registered."));
            }
            if (!verifiedEmail(email, payload.get("emailVerificationToken"))) {
                return ResponseEntity.badRequest().body(Map.of("message", "Verify the worker's email with the verification code before creating the account."));
            }

            Worker w = new Worker(fullName, email, passwordEncoder.encode(password), phone, workerCode, age, diseases, healthHistory);
            if (authHeader != null && authHeader.startsWith("Bearer ")) w.setCreatedByDoctorEmail(requireDoctorEmail(authHeader));
            workerRepository.save(w);
            saveAuditLog("Worker Registered", "Created worker account: " + fullName + " (" + workerCode + ")", "doctor");
            return ResponseEntity.ok(w);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/doctor/workers/{id}")
    public ResponseEntity<?> searchWorker(@RequestHeader("Authorization") String authHeader, @PathVariable Long id) {
        requireDoctorEmail(authHeader);
        Optional<Worker> opt = workerRepository.findById(id);
        if (opt.isPresent()) {
            return ResponseEntity.ok(opt.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Worker not found."));
    }

    @DeleteMapping("/doctor/workers/{id}")
    public ResponseEntity<?> deleteWorker(@RequestHeader("Authorization") String authHeader, @PathVariable Long id) {
        requireDoctorEmail(authHeader);
        if (!doctorCanAccessWorker(authHeader, id)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "You cannot delete a patient assigned to another doctor."));
        Optional<Worker> opt = workerRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Worker not found."));
        }
        Worker w = opt.get();
        workerRepository.delete(w);
        saveAuditLog("Worker Deleted", "Deleted worker account: " + w.getFullName(), "doctor");
        return ResponseEntity.ok(Map.of("message", "Worker deleted successfully."));
    }

    @PutMapping("/doctor/workers/code/{workerCode}/risk")
    public ResponseEntity<?> updateWorkerRiskByCode(@RequestHeader("Authorization") String authHeader, @PathVariable String workerCode, @RequestBody Map<String, Object> payload) {
        Optional<Worker> opt = workerRepository.findByWorkerCode(workerCode);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Worker not found."));
        }
        requireDoctorEmail(authHeader);
        Worker w = opt.get();
        String riskLevel = (String) payload.get("riskLevel");
        w.setRiskLevel(riskLevel);
        workerRepository.save(w);
        saveAuditLog("Worker Risk Assessed", "Assessed risk for: " + w.getFullName() + " as " + riskLevel, "doctor");
        return ResponseEntity.ok(w);
    }

    // ==========================================
    // WORKER ENDPOINTS
    // ==========================================

    @GetMapping("/worker/profile/{id}")
    public ResponseEntity<?> getWorkerProfile(@RequestHeader("Authorization") String authHeader, @PathVariable Long id) {
        String token = authHeader.replace("Bearer ", "");
        String role = jwtUtil.extractRole(token);
        if ("worker".equalsIgnoreCase(role) && !Objects.equals(jwtUtil.extractId(token), id)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "You can only view your own profile."));
        Optional<Worker> opt = workerRepository.findById(id);
        if (opt.isPresent()) {
            return ResponseEntity.ok(opt.get());
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Worker not found."));
    }

    // Used only by health-service while composing the QR medical history.
    // It prevents the QR response from falling back to a demo worker name.
    @GetMapping("/internal/workers/{id}")
    public ResponseEntity<?> getInternalWorkerProfile(@PathVariable Long id) {
        return workerRepository.findById(id).<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Worker not found.")));
    }

    @PostMapping("/internal/workers/{id}/qr-otp/send")
    public ResponseEntity<?> sendQrOtp(@PathVariable Long id) {
        return workerRepository.findById(id).<ResponseEntity<?>>map(worker -> {
            emailOtpService.sendOtp(worker.getEmail());
            String email = worker.getEmail();
            String masked = email.substring(0, Math.min(2, email.indexOf('@'))) + "***" + email.substring(email.indexOf('@'));
            return ResponseEntity.ok(Map.of("message", "Verification code sent.", "maskedEmail", masked));
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Worker not found.")));
    }

    @PostMapping("/internal/workers/{id}/qr-otp/verify")
    public ResponseEntity<?> verifyQrOtp(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return workerRepository.findById(id).<ResponseEntity<?>>map(worker -> {
            String verificationToken = emailOtpService.verifyOtp(worker.getEmail(), payload.get("otp"));
            return ResponseEntity.ok(Map.of("verificationToken", verificationToken));
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Worker not found.")));
    }

    private String requireDoctorEmail(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) throw new IllegalArgumentException("Doctor authentication is required.");
        String token = authHeader.substring(7);
        if (!"doctor".equalsIgnoreCase(jwtUtil.extractRole(token))) throw new IllegalArgumentException("Doctor access is required.");
        return jwtUtil.extractEmail(token);
    }

    private boolean doctorCanAccessWorker(String authHeader, Long workerId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", authHeader);
            ResponseEntity<Boolean> response = restTemplate.exchange(healthServiceUrl + "/api/internal/doctor-patients/" + workerId,
                    org.springframework.http.HttpMethod.GET, new org.springframework.http.HttpEntity<>(headers), Boolean.class);
            return Boolean.TRUE.equals(response.getBody());
        } catch (Exception ignored) {
            return false;
        }
    }

    @PutMapping("/worker/profile")
    public ResponseEntity<?> updateWorkerProfile(@RequestBody Map<String, Object> payload) {
        Worker w = null;
        if (payload.get("id") != null) {
            try {
                Long id = ((Number) payload.get("id")).longValue();
                w = workerRepository.findById(id).orElse(null);
            } catch (Exception e) {}
        }
        if (w == null && payload.get("email") != null) {
            String email = (String) payload.get("email");
            w = workerRepository.findByEmail(email).orElse(null);
        }
        if (w == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Worker profile not found."));
        }

        if (payload.containsKey("fullName")) w.setFullName((String) payload.get("fullName"));
        if (payload.containsKey("phone") && !Objects.equals((String) payload.get("phone"), w.getPhone())) {
            if (!verifiedPhone((String) payload.get("phone"), payload.get("phoneVerificationToken"))) return ResponseEntity.badRequest().body(Map.of("message", "Verify the new mobile number with OTP first."));
            w.setPhone((String) payload.get("phone"));
        }
        if (payload.containsKey("age") && payload.get("age") != null) {
            try {
                w.setAge(((Number) payload.get("age")).intValue());
            } catch (Exception e) {}
        }
        if (payload.containsKey("healthHistory")) w.setHealthHistory((String) payload.get("healthHistory"));
        if (payload.containsKey("address")) w.setHealthHistory((String) payload.get("address"));
        
        workerRepository.save(w);
        saveAuditLog("Worker Profile Updated", "Worker " + w.getFullName() + " updated their profile", "worker");
        return ResponseEntity.ok(w);
    }

    @GetMapping("/worker/settings")
    public ResponseEntity<?> getWorkerSettings(@RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extractEmail(authHeader.replace("Bearer ", ""));
        return workerRepository.findByEmail(email)
                .<ResponseEntity<?>>map(worker -> ResponseEntity.ok(workerSettings(worker)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Worker account not found.")));
    }

    @PutMapping("/worker/settings")
    public ResponseEntity<?> updateWorkerSettings(@RequestHeader("Authorization") String authHeader, @RequestBody Map<String, Object> payload) {
        String email = jwtUtil.extractEmail(authHeader.replace("Bearer ", ""));
        Optional<Worker> worker = workerRepository.findByEmail(email);
        if (worker.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Worker account not found."));
        Worker account = worker.get();
        if (payload.containsKey("twoFactor")) account.setTwoFactor((Boolean) payload.get("twoFactor"));
        if (payload.containsKey("emailNotifications")) account.setEmailNotifications((Boolean) payload.get("emailNotifications"));
        if (payload.containsKey("pushNotifications")) account.setPushNotifications((Boolean) payload.get("pushNotifications"));
        if (payload.containsKey("theme")) account.setTheme((String) payload.get("theme"));
        if (payload.containsKey("language")) account.setLanguage((String) payload.get("language"));
        if (payload.containsKey("newPassword") && payload.get("newPassword") != null && !payload.get("newPassword").toString().isBlank()) account.setPassword(passwordEncoder.encode(payload.get("newPassword").toString()));
        workerRepository.save(account);
        return ResponseEntity.ok(workerSettings(account));
    }

    private Map<String, Object> doctorSettings(Doctor doctor) {
        Map<String, Object> result = new LinkedHashMap<>(); result.put("name", doctor.getFullName()); result.put("email", doctor.getEmail()); result.put("phone", doctor.getPhone()); result.put("twoFactor", Boolean.TRUE.equals(doctor.getTwoFactor())); result.put("emailNotifications", Boolean.TRUE.equals(doctor.getEmailNotifications())); result.put("pushNotifications", Boolean.TRUE.equals(doctor.getPushNotifications())); result.put("theme", doctor.getTheme() == null ? "light" : doctor.getTheme()); result.put("language", doctor.getLanguage() == null ? "English" : doctor.getLanguage()); return result;
    }
    private Map<String, Object> workerSettings(Worker worker) {
        Map<String, Object> result = new LinkedHashMap<>(); result.put("name", worker.getFullName()); result.put("email", worker.getEmail()); result.put("phone", worker.getPhone()); result.put("twoFactor", Boolean.TRUE.equals(worker.getTwoFactor())); result.put("emailNotifications", Boolean.TRUE.equals(worker.getEmailNotifications())); result.put("pushNotifications", Boolean.TRUE.equals(worker.getPushNotifications())); result.put("theme", worker.getTheme() == null ? "light" : worker.getTheme()); result.put("language", worker.getLanguage() == null ? "English" : worker.getLanguage()); return result;
    }

    // Helper to log actions (non-critical — login must not fail if audit log fails)
    private void saveAuditLog(String action, String details, String role) {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            auditLogRepository.save(new AuditLog(sdf.format(new Date()), action, details, role));
        } catch (Exception e) {
            // Audit logging is non-critical; do not propagate the error
            System.err.println("[WARN] Audit log skipped: " + e.getMessage());
        }
    }
}
