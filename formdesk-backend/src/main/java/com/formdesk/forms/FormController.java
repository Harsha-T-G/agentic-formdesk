package com.formdesk.forms;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.formdesk.submission.SubmissionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.bind.annotation.*;
import static com.formdesk.common.ApiModels.Data;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "forms")
public class FormController {
    private final Map<String, Object> form;
    private final SubmissionRepository repository;
    public FormController(ObjectMapper mapper, SubmissionRepository repository) throws IOException {
        try (var stream = new ClassPathResource("contact-form.json").getInputStream()) { form = mapper.readValue(stream, new TypeReference<>() {}); }
        this.repository = repository;
    }

    @GetMapping("/forms")
    @Operation(operationId = "listForms", summary = "List available forms")
    public Data<List<Map<String, Object>>> list() { return new Data<>(List.of(form)); }

    @GetMapping("/forms/contact")
    @Operation(operationId = "getContactForm", summary = "Read the contact form fields and requirements")
    public Data<Map<String, Object>> get() { return new Data<>(form); }

    @GetMapping("/health")
    @Operation(operationId = "getHealth", summary = "Check API and database connectivity")
    public Data<Map<String, String>> health() { repository.count(); return new Data<>(Map.of("status", "ok", "database", "postgresql")); }
}
