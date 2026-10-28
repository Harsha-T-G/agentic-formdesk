package com.formdesk.submission;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import java.time.Instant;
import java.util.UUID;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record SubmissionResponse(
        UUID id, String formId, SubmissionStatus status, String firstName, String lastName,
        String email, String phone, String company, String role, RequestType requestType,
        String message, boolean consent, Instant createdAt, Instant updatedAt, Instant submittedAt) {}
