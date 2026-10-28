package com.formdesk.submission;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@Validated
@Tag(name = "submissions")
public class ExportController {
    private final SubmissionService service;
    public ExportController(SubmissionService service) { this.service = service; }

    @GetMapping(path = "/api/v1/submissions.csv", produces = "text/csv")
    @Operation(operationId = "exportSubmissions", summary = "Export matching records as CSV")
    public ResponseEntity<String> export(@RequestParam(required = false) SubmissionStatus status,
            @RequestParam(defaultValue = "") @Size(max = 200) String q) {
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"formdesk-submissions.csv\"").body(service.csv(status, q));
    }
}
