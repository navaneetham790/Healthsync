package com.healthsync.userservice.services;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CompletableFuture;

@Service
public class EmailOtpService {
    private static final long OTP_EXPIRY_MS = 10 * 60 * 1000L;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, OtpRecord> otpRecords = new ConcurrentHashMap<>();
    private final Map<String, VerificationRecord> verifiedEmails = new ConcurrentHashMap<>();
    private final EmailService emailService;

    public EmailOtpService(EmailService emailService) {
        this.emailService = emailService;
    }

    public String sendOtp(String rawEmail) {
        String email = normalize(rawEmail);
        String code = String.format("%06d", random.nextInt(1_000_000));
        otpRecords.put(email, new OtpRecord(code, System.currentTimeMillis() + OTP_EXPIRY_MS));
        try {
            emailService.sendVerificationCode(email, code);
        } catch (Exception ignored) {
        }
        return code;
    }

    /** Creates the OTP immediately, while SMTP delivery happens off the login request. */
    public void sendOtpForLoginAsync(String rawEmail) {
        String email = normalize(rawEmail);
        String code = String.format("%06d", random.nextInt(1_000_000));
        otpRecords.put(email, new OtpRecord(code, System.currentTimeMillis() + OTP_EXPIRY_MS));
        CompletableFuture.runAsync(() -> emailService.sendVerificationCode(email, code));
    }

    public String verifyOtp(String rawEmail, String code) {
        String email = normalize(rawEmail);
        OtpRecord record = otpRecords.get(email);
        if (record == null || record.expiresAt < System.currentTimeMillis()) {
            throw new IllegalArgumentException("Verification code has expired. Please request a new code.");
        }
        if (code == null || !record.code.equals(code.trim())) {
            throw new IllegalArgumentException("Incorrect verification code. Please check the code sent to your email.");
        }
        otpRecords.remove(email);
        String token = UUID.randomUUID().toString();
        verifiedEmails.put(token, new VerificationRecord(email, System.currentTimeMillis() + OTP_EXPIRY_MS));
        return token;
    }

    public boolean isVerified(String rawEmail, String token) {
        if (token == null || token.isBlank()) return false;
        VerificationRecord record = verifiedEmails.get(token);
        String email = normalize(rawEmail);
        if (record == null || record.expiresAt < System.currentTimeMillis() || !record.email.equals(email)) return false;
        verifiedEmails.remove(token);
        return true;
    }

    private String normalize(String rawEmail) {
        String email = rawEmail == null ? "" : rawEmail.trim().toLowerCase();
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) throw new IllegalArgumentException("Enter a valid email address.");
        return email;
    }

    private record OtpRecord(String code, long expiresAt) {}
    private record VerificationRecord(String email, long expiresAt) {}
}
