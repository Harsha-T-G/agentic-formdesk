package com.formdesk.common;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import java.util.List;

public final class ApiModels {
    private ApiModels() {}
    public record Data<T>(T data) {}
    public record FieldError(String field, String message) {}
    public record ErrorBody(String code, String message, List<FieldError> details) {}
    public record ErrorEnvelope(ErrorBody error) {}
    public record Counts(long all, long submitted, long draft) {}
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record Pagination(long total, int page, int perPage, int totalPages, Counts counts) {}
    public record Collection<T>(List<T> data, Pagination meta) {}

    public static String snake(String field) {
        return field.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase(java.util.Locale.ROOT);
    }
}
