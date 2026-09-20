package com.healthsync.userservice.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.password-reset-url:${PASSWORD_RESET_URL:http://localhost:5173/reset-password}}")
    private String passwordResetUrl;

    @Value("${spring.mail.username:${SMTP_USERNAME:}}")
    private String fromEmail;

    @Value("${mail.webhook-url:${MAIL_WEBHOOK_URL:}}")
    private String mailWebhookUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.ALWAYS)
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private boolean sendViaWebhook(String toEmail, String subject, String body) {
        if (mailWebhookUrl == null || mailWebhookUrl.isBlank()) {
            return false;
        }
        try {
            String json = String.format("{\"to\":\"%s\",\"subject\":\"%s\",\"body\":\"%s\"}",
                    escapeJson(toEmail),
                    escapeJson(subject),
                    escapeJson(body));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(mailWebhookUrl.trim()))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .timeout(Duration.ofSeconds(12))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() >= 200 && response.statusCode() < 400;
        } catch (Exception e) {
            System.err.println("[WARN] Google Webhook mail delivery failed: " + e.getMessage());
            return false;
        }
    }

    private String escapeJson(String raw) {
        if (raw == null) return "";
        return raw.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }

    private void deliverEmail(String toEmail, String subject, String body) {
        if (sendViaWebhook(toEmail, subject, body)) {
            System.out.println("[OK] Email delivered via Google Webhook to " + toEmail);
            return;
        }

        if (mailSender != null && fromEmail != null && !fromEmail.isBlank()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(toEmail);
                message.setFrom(fromEmail);
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
                System.out.println("[OK] Email delivered via SMTP to " + toEmail);
            } catch (Exception exception) {
                System.err.println("[WARN] SMTP delivery failed: " + exception.getMessage());
            }
        } else {
            System.out.println("[INFO] Email message for " + toEmail + ":\n" + body);
        }
    }

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String separator = passwordResetUrl.contains("?") ? "&" : "?";
        String resetLink = passwordResetUrl + separator + "token=" + URLEncoder.encode(resetToken, StandardCharsets.UTF_8);

        String subject = "HealthSync - Reset your password";
        String body = "Hello,\n\n" +
                "A password reset was requested for your HealthSync account.\n\n" +
                "Open this link to choose a new password:\n" + resetLink + "\n\n" +
                "This link expires in 15 minutes.\n\n" +
                "If you did not make this request, you can safely ignore this email.\n\n" +
                "HealthSync Administration Team";

        deliverEmail(toEmail, subject, body);
    }

    public void sendVerificationCode(String toEmail, String code) {
        String subject = "HealthSync - Email verification code";
        String body = "Your HealthSync verification code is " + code + ".\n\n"
                + "This code expires in 10 minutes. Do not share it with anyone.";

        deliverEmail(toEmail, subject, body);
    }

    public void sendTerminationEmail(String toEmail, String doctorName, String adminMessage) {
        String subject = "HealthSync - Account termination notice";
        String body = "Dear Dr. " + doctorName + ",\n\n" + adminMessage.trim() + "\n\n"
                + "Your HealthSync doctor account has been terminated and you can no longer sign in.\n\n"
                + "HealthSync Administration Team";

        deliverEmail(toEmail, subject, body);
    }

    public void sendDoctorApplicationInvitation(String toEmail, String doctorName, String formLink) {
        String subject = "HealthSync - Complete your doctor verification form";
        String body = "Dear " + (doctorName == null || doctorName.isBlank() ? "Doctor" : "Dr. " + doctorName) + ",\n\n"
                + "HealthSync Administration has invited you to complete your professional verification form. "
                + "Your account will be created only after the submitted documents are approved.\n\n"
                + "Open your secure form: " + formLink + "\n\nThis link expires in 7 days.\n\nHealthSync Administration Team";

        deliverEmail(toEmail, subject, body);
    }

    public void sendDoctorApplicationSubmitted(String adminEmail, String doctorName, String doctorEmail, String registrationNumber) {
        String subject = "HealthSync - Doctor verification submitted";
        String body = "A doctor verification form has been submitted.\n\nDoctor: " + doctorName + "\nEmail: " + doctorEmail
                + "\nMedical registration number: " + registrationNumber + "\n\nPlease sign in to HealthSync and review the application.";

        deliverEmail(adminEmail, subject, body);
    }

    public void sendDoctorApplicationDecision(String toEmail, String doctorName, boolean approved, String reason) {
        String subject = "HealthSync - Doctor verification " + (approved ? "approved" : "rejected");
        String decision = approved
                ? "Your verification has been approved. HealthSync Administration will now create your doctor account using the password you set in the verification form. You will be able to sign in once the account is created."
                : "Your verification was not approved. Reason provided by the administrator: " + reason;
        String body = "Dear Dr. " + doctorName + ",\n\n" + decision + "\n\nHealthSync Administration Team";

        deliverEmail(toEmail, subject, body);
    }
}
