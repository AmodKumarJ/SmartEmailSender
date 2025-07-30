package amod.dev.SmartEmailSender.Controller;


import amod.dev.SmartEmailSender.Services.MailService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.MessagingException;
import org.apache.poi.ss.formula.functions.T;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/resume")
public class ResumeController {
    @Autowired
    MailService mailService;
    private static final String UPLOAD_DIR = "uploads/";

    @PostMapping("/upload")
    public ResponseEntity<String> uploadResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam("companyName") String companyName,
            @RequestParam(value = "jobTitle", required = false) String jobTitle,
            @RequestParam("template") String template) {
        try (InputStream input = file.getInputStream()) {
            String fileType = file.getContentType();

            if (fileType == null || (!fileType.equalsIgnoreCase("application/pdf")
                    && !fileType.equalsIgnoreCase("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or unsupported file type");
            }

            File dir = new File(UPLOAD_DIR);
            if (!dir.exists()) dir.mkdirs();

            String fileName = file.getOriginalFilename();
            Path filePath = Paths.get(UPLOAD_DIR + fileName);
            Files.write(filePath, file.getBytes());

            Tika tika = new Tika();
            String resumeText = tika.parseToString(input);

            String prompt1 = "You are an expert job assistant. Based on the following resume:\n\n" + resumeText +
                    "\n\nI have previously worked at QICPIC Innovations Pvt. Ltd. and 1TX Technology India Pvt. Ltd as a full-stack developer using React.js and Spring Boot.\n\n" +
                    "Write a short and impactful cold email body (max 80 words) to apply for the position of " + jobTitle +
                    " at " + companyName + ". Do not include any subject line or heading." +
                    " keep the tone confident and professional." +
                    " Do not add any extra explanation or context.";

            String prompt2 = "You are an expert job assistant. Based on the following resume:\n\n" + resumeText +
                    "\n\nI have previously worked at QICPIC Innovations Pvt. Ltd. and 1TX Technology India Pvt. Ltd as a full-stack developer using React.js and Spring Boot.\n\n" +
                    "Write a short and impactful cold email body (max 80 words) to inquire about any current or upcoming job openings at " + companyName +
                    ". Do not include any subject line or heading." +
                    " keep the tone confident and professional." +
                    " Do not add any extra explanation or context.";


            String prompt = "application".equals(template) ? prompt1 : prompt2;


            String aiResponse = sendToLlama(prompt);
            String emailBody = parseEmailFromLlamaResponse(aiResponse);


            return ResponseEntity.ok("File saved successfully!\n\nExtracted text:\n" +
                    "\n\nAI Mail Response:\n" + emailBody);
        } catch (IOException | TikaException | InterruptedException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/send/email")
    public ResponseEntity<String> askOpening(
            @RequestParam("to") String to,
            @RequestParam("companyName") String companyName,
            @RequestParam("hiringManagerName") String hiringManagerName,
            @RequestParam("body") String body
    ) {
        try {
            // Load the template
            String template = new String(
                    Files.readAllBytes(Paths.get("src/main/resources/templates/asking_job_template.html"))
            );

            // Replace placeholders
            template = template.replace("{{company_name}}", companyName)
                    .replace("{{hiring_manager_name}}", hiringManagerName)
                    .replace("{{inquiry_message}}", body);

            // Call MailService
            mailService.sendEmail(to, "Job Opening Inquiry", template);

            return ResponseEntity.ok("Email sent successfully!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to send email: " + e.getMessage());
        }
    }

    @PostMapping("/send_job/email")
    public ResponseEntity<String> jobMail(
            @RequestParam("to") String to,
            @RequestParam("jobTitle") String jobTitle,
            @RequestParam("body") String body
    ) {
        try {
            // Load the template
            String template = new String(
                    Files.readAllBytes(Paths.get("src/main/resources/templates/job-application-template.html"))
            );

            // Replace placeholders
            template = template.replace("{{job_title}}", jobTitle)
                    .replace("{{body_content}}", body);

            String subject = "Job Application for -- "+jobTitle;

            // Call MailService
            mailService.sendEmail(to, subject, template);

            return ResponseEntity.ok("Email sent successfully!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to send email: " + e.getMessage());
        }
    }


    public String sendToLlama(String prompt) throws IOException, InterruptedException {
        ObjectMapper mapper = new ObjectMapper();




        Map<String, Object> payloadMap = new HashMap<>();
        payloadMap.put("model", "llama3");
        payloadMap.put("prompt", prompt);
        payloadMap.put("stream", false);

        String payload = mapper.writeValueAsString(payloadMap);  // ✅ Escapes everything properly

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:11434/api/generate"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }
    private String parseEmailFromLlamaResponse(String json) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(json);
            return root.path("response").asText();
        } catch (Exception e) {
            return "Could not parse LLaMA response.";
        }
    }
}
