package com.formdesk.common;

import jakarta.validation.ConstraintViolationException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import static com.formdesk.common.ApiModels.*;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ErrorEnvelope> domain(ApiException ex) { return error(ex.status(), ex.code(), ex.getMessage(), ex.details()); }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorEnvelope> validation(MethodArgumentNotValidException ex) {
        return error(HttpStatus.UNPROCESSABLE_ENTITY, "validation_error", "Please check the highlighted fields.",
                ex.getBindingResult().getFieldErrors().stream().map(e -> new FieldError(snake(e.getField()), e.getDefaultMessage())).toList());
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class, ConstraintViolationException.class})
    ResponseEntity<ErrorEnvelope> malformed(Exception ex) {
        return error(HttpStatus.BAD_REQUEST, "invalid_request", "Check the JSON, field types, and query parameters.", List.of());
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    ResponseEntity<ErrorEnvelope> conflict(Exception ex) {
        return error(HttpStatus.CONFLICT, "conflict", "This record changed. Reload it before trying again.", List.of());
    }

    @ExceptionHandler({HttpMediaTypeNotSupportedException.class, HttpRequestMethodNotSupportedException.class, NoResourceFoundException.class})
    ResponseEntity<ErrorEnvelope> protocol(Exception ex) {
        var response = (org.springframework.web.ErrorResponse) ex;
        return ResponseEntity.status(response.getStatusCode()).body(new ErrorEnvelope(new ErrorBody("request_error", "Check the request path, method, and content type.", List.of())));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorEnvelope> unexpected(Exception ex) {
        log.error("Request failed", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "internal_error", "Something went wrong. Please try again.", List.of());
    }

    private ResponseEntity<ErrorEnvelope> error(HttpStatus status, String code, String message, List<FieldError> details) {
        return ResponseEntity.status(status).body(new ErrorEnvelope(new ErrorBody(code, message, details)));
    }
}
