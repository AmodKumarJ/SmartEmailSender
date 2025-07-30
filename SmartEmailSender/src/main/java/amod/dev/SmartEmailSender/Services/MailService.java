package amod.dev.SmartEmailSender.Services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.io.File;

@Service
public class MailService {

    @Autowired
    private JavaMailSender mailSender;

    // Send HTML email (no attachment)
    public void sendEmail(String to, String subject, String htmlBody) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        helper.setFrom("your.email@gmail.com");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlBody, true); // true = HTML content
        mailSender.send(message);
    }

    // Existing method for attachment (no change)
    public void sendEmailWithAttachment(String to, String subject, String body, File attachment) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);
        helper.setFrom("your.email@gmail.com");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(body, true);
        FileSystemResource file = new FileSystemResource(attachment);
        helper.addAttachment(file.getFilename(), file);
        mailSender.send(message);
    }
}

