package com.formdesk.submission;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Drafts can omit fields. Submitted requests require names, email, request type, a message of at least 10 characters, and consent=true.")
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record SubmissionRequest(
        @Pattern(regexp = "contact", message = "Choose the contact form.") String formId,
        SubmissionStatus status,
        @Size(max = 80) String firstName,
        @Size(max = 80) String lastName,
        @Email(message = "Enter a valid email address.") @Size(max = 254) String email,
        @Size(max = 40) String phone,
        @Size(max = 120) String company,
        @Pattern(regexp = "|Founder|Engineer|Designer|Student|Other", message = "Choose an available role.") String role,
        RequestType requestType,
        @Size(max = 2000) String message,
        Boolean consent) {

    public SubmissionRequest {
        formId = formId == null ? "contact" : formId.trim();
        firstName = clean(firstName);
        lastName = clean(lastName);
        email = clean(email);
        phone = clean(phone);
        company = clean(company);
        role = clean(role);
        message = clean(message);
    }

    private static String clean(String value) { return value == null ? "" : value.trim(); }
}
