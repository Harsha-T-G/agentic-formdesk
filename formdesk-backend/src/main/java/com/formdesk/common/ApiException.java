package com.formdesk.common;

import java.util.List;
import org.springframework.http.HttpStatus;
import static com.formdesk.common.ApiModels.FieldError;

public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String code;
    private final List<FieldError> details;

    public ApiException(HttpStatus status, String code, String message) { this(status, code, message, List.of()); }
    public ApiException(HttpStatus status, String code, String message, List<FieldError> details) {
        super(message); this.status = status; this.code = code; this.details = List.copyOf(details);
    }
    public HttpStatus status() { return status; }
    public String code() { return code; }
    public List<FieldError> details() { return details; }
}
