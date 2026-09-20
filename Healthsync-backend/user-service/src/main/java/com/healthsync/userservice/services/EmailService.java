package com.healthsync.userservice.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.password-reset-url}")
    private String passwordResetUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String separator = passwordResetUrl.contains("?") ? "&" : "?";
        String resetLink = passwordResetUrl + separator + "token=" + URLEncoder.encode(resetToken, StandardCharsets.UTF_8);

        if (fromEmail == null || fromEmail.isBlank()) {
            System.out.println("\n\n=================================================");
            System.out.println("PASSWORD RESET LINK (Email service not configured)");
            System.out.println("To: " + toEmail);
            System.out.println("Link: " + resetLink);
            System.out.println("=================================================\n\n");
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        // Do not add CC/BCC recipients: the link is sent only to the account owner.
        message.setTo(toEmail);
        message.setFrom(fromEmail);
        message.setSubject("HealthSync - Reset your password");
        message.setText("Hello,\n\n" +
                "A password reset was requested for your HealthSync account.\n\n" +
                "Open this link to choose a new password:\n" + resetLink + "\n\n" +
                "This link expires in 15 minutes.\n\n" +
                "If you did not make this request, you can safely ignore this email.\n\n" +
                "HealthSync Administration Team");

        mailSender.send(message);
    }

    public void sendVerificationCode(String toEmail, String code) {
        if (fromEmail == null || fromEmail.isBlank()) {
            throw new IllegalStateException("Email service is not configured. Set SMTP_USERNAME and SMTP_PASSWORD, then restart the backend.");
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setFrom(fromEmail);
        message.setSubject("HealthSync - Email verification code");
        message.setText("Your HealthSync verification code is " + code + ".\n\n"
                + "This code expires in 10 minutes. Do not share it with anyone.");
        mailSender.send(message);
    }

    public void sendTerminationEmail(String toEmail, String doctorName, String adminMessage) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setFrom(fromEmail);
        message.setSubject("HealthSync - Account termination notice");
        message.setText("Dear Dr. " + doctorName + ",\n\n" + adminMessage.trim() + "\n\n"
                + "Your HealthSync doctor account has been terminated and you can no longer sign in.\n\n"
                + "HealthSync Administration Team");
        mailSender.send(message);
    }

    public void sendDoctorApplicationInvitation(String toEmail, String doctorName, String formLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail); message.setFrom(fromEmail);
        message.setSubject("HealthSync - Complete your doctor verification form");
        message.setText("Dear " + (doctorName == null || doctorName.isBlank() ? "Doctor" : "Dr. " + doctorName) + ",\n\n"
                + "HealthSync Administration has invited you to complete your professional verification form. "
                + "Your account will be created only after the submitted documents are approved.\n\n"
                + "Open your secure form: " + formLink + "\n\nThis link expires in 7 days.\n\nHealthSync Administration Team");
        mailSender.send(message);
    }

    public void sendDoctorApplicationSubmitted(String adminEmail, String doctorName, String doctorEmail, String registrationNumber) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(adminEmail); message.setFrom(fromEmail);
        message.setSubject("HealthSync - Doctor verification submitted");
        message.setText("A doctor verification form has been submitted.\n\nDoctor: " + doctorName + "\nEmail: " + doctorEmail
                + "\nMedical registration number: " + registrationNumber + "\n\nPlease sign in to HealthSync and review the application.");
        mailSender.send(message);
    }

    public void sendDoctorApplicationDecision(String toEmail, String doctorName, boolean approved, String reason) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail); message.setFrom(fromEmail);
        message.setSubject("HealthSync - Doctor verification " + (approved ? "approved" : "rejected"));
        String decision = approved
                ? "Your verification has been approved. HealthSync Administration will now create your doctor account using the password you set in the verification form. You will be able to sign in once the account is created."
                : "Your verification was not approved. Reason provided by the administrator: " + reason;
        message.setText("Dear Dr. " + doctorName + ",\n\n" + decision + "\n\nHealthSync Administration Team");
        mailSender.send(message);
    }
}
