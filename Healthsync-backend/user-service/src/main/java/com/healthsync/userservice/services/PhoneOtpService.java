package com.healthsync.userservice.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PhoneOtpService {
    private static final long OTP_EXPIRY_MS = 10 * 60 * 1000L;
    private final SecureRandom random = new SecureRandom();
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final Map<String, OtpRecord> otpRecords = new ConcurrentHashMap<>();
    private final Map<String, VerificationRecord> verifiedPhones = new ConcurrentHashMap<>();

    @Value("${twilio.account-sid:}") private String accountSid;
    @Value("${twilio.auth-token:}") private String authToken;
    @Value("${twilio.phone-number:}") private String fromNumber;

    public void sendOtp(String rawPhone) {
        String phone = normalize(rawPhone);
        if (accountSid.isBlank() || authToken.isBlank() || fromNumber.isBlank()) {
            throw new IllegalStateException("SMS service is not configured.");
        }
        String code = String.format("%06d", random.nextInt(1_000_000));
        String message = "Your HealthSync verification code is " + code + ". It expires in 10 minutes. Do not share this code.";
        String form = "To=" + encode(phone) + "&From=" + encode(fromNumber) + "&Body=" + encode(message);
        String credentials = Base64.getEncoder().encodeToString((accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8));
        HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json"))
                .header("Authorization", "Basic " + credentials)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form)).build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Twilio rejected the OTP request (HTTP " + response.statusCode() + "). Check the Twilio Active Number and, for a trial account, verify the recipient mobile number in Twilio.");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("OTP request was interrupted.");
        } catch (IllegalStateException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to contact Twilio to send OTP (" + exception.getClass().getSimpleName() + ").");
        }
        otpRecords.put(phone, new OtpRecord(code, System.currentTimeMillis() + OTP_EXPIRY_MS));
    }

    public String verifyOtp(String rawPhone, String code) {
        String phone = normalize(rawPhone);
        OtpRecord record = otpRecords.get(phone);
        if (record == null || record.expiresAt < System.currentTimeMillis() || !record.code.equals(code)) {
            throw new IllegalArgumentException("Invalid or expired OTP.");
        }
        otpRecords.remove(phone);
        String token = UUID.randomUUID().toString();
        verifiedPhones.put(token, new VerificationRecord(phone, System.currentTimeMillis() + OTP_EXPIRY_MS));
        return token;
    }

    public boolean isVerified(String rawPhone, String token) {
        if (token == null || token.isBlank()) return false;
        VerificationRecord record = verifiedPhones.get(token);
        String phone = normalize(rawPhone);
        if (record == null || record.expiresAt < System.currentTimeMillis() || !record.phone.equals(phone)) return false;
        verifiedPhones.remove(token);
        return true;
    }

    private String normalize(String rawPhone) {
        String digits = rawPhone == null ? "" : rawPhone.replaceAll("[^0-9+]", "");
        if (digits.matches("[6-9][0-9]{9}")) return "+91" + digits;
        if (digits.matches("\\+?[1-9][0-9]{7,14}")) return digits.startsWith("+") ? digits : "+" + digits;
        throw new IllegalArgumentException("Enter a valid mobile number including country code when required.");
    }

    private String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }

    private record OtpRecord(String code, long expiresAt) {}
    private record VerificationRecord(String phone, long expiresAt) {}
}
