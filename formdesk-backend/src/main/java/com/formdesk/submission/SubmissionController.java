package com.formdesk.submission;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import static com.formdesk.common.ApiModels.*;

@RestController
@RequestMapping("/api/v1/submissions")
@Validated
@Tag(name = "submissions", description = "Persist and retrieve form submissions in PostgreSQL.")
public class SubmissionController {
    private final SubmissionService service;
    public SubmissionController(SubmissionService service) { this.service = service; }

    @GetMapping
    @Operation(operationId = "listSubmissions", summary = "List, filter, and search saved submissions")
    public Collection<SubmissionResponse> list(
            @RequestParam(required = false) SubmissionStatus status,
            @RequestParam(defaultValue = "") @Size(max = 200) String q,
            @RequestParam(defaultValue = "1") @Min(1) @Max(1000000) int page,
            @RequestParam(name = "per_page", defaultValue = "10") @Min(1) @Max(100) int perPage) {
        return service.list(status, q, page, perPage);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(operationId = "createSubmission", summary = "Create a draft or submit a completed form")
    public ResponseEntity<Data<SubmissionResponse>> create(@Valid @RequestBody SubmissionRequest input) {
        var saved = service.create(input);
        return ResponseEntity.created(URI.create("/api/v1/submissions/" + saved.id())).body(new Data<>(saved));
    }

    @GetMapping("/{id}")
    @Operation(operationId = "getSubmission", summary = "Read a saved submission")
    public Data<SubmissionResponse> get(@PathVariable UUID id) { return new Data<>(service.get(id)); }

    @PatchMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(operationId = "updateSubmission", summary = "Update fields or submit a saved draft", description = "Only supplied fields change. Validation applies to the merged record. Draft request_type may be null; submitted requests require it.")
    public Data<SubmissionResponse> patch(@PathVariable UUID id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(content = @io.swagger.v3.oas.annotations.media.Content(schema = @Schema(implementation = SubmissionRequest.class)))
            @RequestBody Map<String, Object> input) { return new Data<>(service.patch(id, input)); }

    @DeleteMapping("/{id}")
    @Operation(operationId = "deleteSubmission", summary = "Delete a submission")
    public ResponseEntity<Void> delete(@PathVariable UUID id) { service.delete(id); return ResponseEntity.noContent().build(); }

}
