package com.formdesk.submission;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.formdesk.common.ApiException;
import jakarta.validation.Validator;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static com.formdesk.common.ApiModels.*;

@Service
@Transactional(readOnly = true)
public class SubmissionService {
    private static final Set<String> FIELDS = Set.of("form_id", "status", "first_name", "last_name", "email", "phone", "company", "role", "request_type", "message", "consent");
    private static final Sort ORDER = Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
    private final SubmissionRepository repository;
    private final Validator validator;
    private final ObjectMapper mapper;

    public SubmissionService(SubmissionRepository repository, Validator validator, ObjectMapper mapper) {
        this.repository = repository; this.validator = validator; this.mapper = mapper;
    }

    @Transactional
    public SubmissionResponse create(SubmissionRequest input) {
        SubmissionStatus status = input.status() == null ? SubmissionStatus.SUBMITTED : input.status();
        validate(input, status);
        Submission entity = new Submission(); entity.apply(input, status);
        return repository.saveAndFlush(entity).response();
    }

    @Transactional
    public SubmissionResponse patch(UUID id, Map<String, Object> patch) {
        Submission entity = find(id);
        ObjectNode merged = mapper.valueToTree(entity.asRequest());
        for (var entry : patch.entrySet()) {
            String field = entry.getKey(); Object value = entry.getValue();
            if (!FIELDS.contains(field)) throw new ApiException(HttpStatus.BAD_REQUEST, "unknown_field", "Unknown field: " + field);
            if (value != null && !(field.equals("consent") ? value instanceof Boolean : value instanceof String)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_type", "Invalid type for " + field);
            }
            merged.set(field, mapper.valueToTree(value));
        }
        SubmissionRequest input;
        try { input = mapper.treeToValue(merged, SubmissionRequest.class); }
        catch (Exception ex) { throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_request", "Check the provided field values."); }
        SubmissionStatus status = input.status() == null ? entity.getStatus() : input.status();
        if (entity.getStatus() == SubmissionStatus.SUBMITTED && status == SubmissionStatus.DRAFT) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "validation_error", "A submitted request cannot become a draft.", List.of(new FieldError("status", "Keep submitted status.")));
        }
        validate(input, status); entity.apply(input, status);
        return repository.saveAndFlush(entity).response();
    }

    public SubmissionResponse get(UUID id) { return find(id).response(); }

    public Collection<SubmissionResponse> list(SubmissionStatus status, String q, int page, int perPage) {
        var records = repository.findAll(filter(status, q), PageRequest.of(page - 1, perPage, ORDER));
        Counts counts = new Counts(repository.count(), repository.countByStatus(SubmissionStatus.SUBMITTED), repository.countByStatus(SubmissionStatus.DRAFT));
        return new Collection<>(records.getContent().stream().map(Submission::response).toList(), new Pagination(records.getTotalElements(), page, perPage, records.getTotalPages(), counts));
    }

    @Transactional
    public void delete(UUID id) { repository.delete(find(id)); repository.flush(); }

    public String csv(SubmissionStatus status, String q) {
        StringBuilder result = new StringBuilder("id,status,first_name,last_name,email,phone,company,role,request_type,message,consent,created_at,submitted_at\r\n");
        for (Submission entity : repository.findAll(filter(status, q), ORDER)) {
            var r = entity.response();
            List<Object> cells = java.util.Arrays.asList(r.id(), r.status().value(), r.firstName(), r.lastName(), r.email(), r.phone(), r.company(), r.role(), r.requestType() == null ? "" : r.requestType().value(), r.message(), r.consent(), r.createdAt(), r.submittedAt());
            result.append(cells.stream().map(this::csvCell).collect(java.util.stream.Collectors.joining(","))).append("\r\n");
        }
        return result.toString();
    }

    private String csvCell(Object value) {
        String text = value == null ? "" : value.toString();
        if (!text.isEmpty() && "=+-@\t\r".indexOf(text.charAt(0)) >= 0) text = "'" + text;
        return "\"" + text.replace("\"", "\"\"") + "\"";
    }

    private Submission find(UUID id) {
        return repository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "not_found", "This submission could not be found."));
    }

    private Specification<Submission> filter(SubmissionStatus status, String q) {
        return (root, query, cb) -> {
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (q != null && !q.isBlank()) {
                String search = "%" + q.trim().toLowerCase(java.util.Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                var fullName = cb.concat(cb.concat(root.get("firstName"), " "), root.get("lastName"));
                predicates.add(cb.or(cb.like(cb.lower(fullName), search, '\\'), cb.like(cb.lower(root.get("email")), search, '\\'), cb.like(cb.lower(root.get("company")), search, '\\')));
            }
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    private void validate(SubmissionRequest input, SubmissionStatus status) {
        List<FieldError> errors = new ArrayList<>(validator.validate(input).stream().map(v -> new FieldError(snake(v.getPropertyPath().toString()), v.getMessage())).toList());
        if (status == SubmissionStatus.SUBMITTED) {
            if (input.firstName().isBlank()) errors.add(new FieldError("first_name", "First name is required."));
            if (input.lastName().isBlank()) errors.add(new FieldError("last_name", "Last name is required."));
            if (input.email().isBlank()) errors.add(new FieldError("email", "Email address is required."));
            if (input.requestType() == null) errors.add(new FieldError("request_type", "Choose a request type."));
            if (input.message().codePointCount(0, input.message().length()) < 10) errors.add(new FieldError("message", "Write at least 10 characters."));
            if (!Boolean.TRUE.equals(input.consent())) errors.add(new FieldError("consent", "Please agree to be contacted before submitting."));
        }
        if (!errors.isEmpty()) throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "validation_error", "Please check the highlighted fields.", errors);
    }
}
