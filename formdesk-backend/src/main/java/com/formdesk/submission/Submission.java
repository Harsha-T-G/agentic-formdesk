package com.formdesk.submission;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "submissions")
public class Submission {
    @Id
    private UUID id = UUID.randomUUID();
    @Version
    private Long version;
    @Column(nullable = false, length = 32)
    private String formId = "contact";
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private SubmissionStatus status;
    @Column(nullable = false, length = 80)
    private String firstName;
    @Column(nullable = false, length = 80)
    private String lastName;
    @Column(nullable = false, length = 254)
    private String email;
    @Column(nullable = false, length = 40)
    private String phone;
    @Column(nullable = false, length = 120)
    private String company;
    @Column(nullable = false, length = 32)
    private String role;
    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private RequestType requestType;
    @Column(nullable = false, length = 2000)
    private String message;
    @Column(nullable = false)
    private boolean consent;
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant updatedAt;
    private Instant submittedAt;

    protected Submission() {}

    public SubmissionStatus getStatus() { return status; }

    void apply(SubmissionRequest input, SubmissionStatus nextStatus) {
        formId = input.formId(); status = nextStatus;
        firstName = input.firstName(); lastName = input.lastName(); email = input.email();
        phone = input.phone(); company = input.company(); role = input.role();
        requestType = input.requestType(); message = input.message(); consent = Boolean.TRUE.equals(input.consent());
        if (nextStatus == SubmissionStatus.SUBMITTED && submittedAt == null) submittedAt = Instant.now();
    }

    @PrePersist
    void created() { createdAt = Instant.now(); updatedAt = createdAt; }

    @PreUpdate
    void updated() { updatedAt = Instant.now(); }

    SubmissionRequest asRequest() {
        return new SubmissionRequest(formId, status, firstName, lastName, email, phone, company, role, requestType, message, consent);
    }

    SubmissionResponse response() {
        return new SubmissionResponse(id, formId, status, firstName, lastName, email, phone, company, role, requestType, message, consent, createdAt, updatedAt, submittedAt);
    }
}
