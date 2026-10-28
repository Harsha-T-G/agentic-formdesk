package com.formdesk;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.formdesk.submission.SubmissionRepository;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.CALLS_REAL_METHODS;
import static org.mockito.Mockito.mockStatic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class SubmissionApiTest {
    @Container
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16.15-alpine").withDatabaseName("formdesk_test");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        properties.add("spring.datasource.username", POSTGRES::getUsername);
        properties.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired SubmissionRepository repository;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void clearTestDatabase() { repository.deleteAll(); }

    Map<String, Object> sample() {
        return new LinkedHashMap<>(Map.of("first_name", "Alex", "last_name", "Morgan", "email", "alex@example.com", "request_type", "project", "message", "I would like to discuss a new project.", "consent", true));
    }

    String create(Map<String, Object> input) throws Exception {
        var result = mvc.perform(post("/api/v1/submissions").contentType("application/json").content(mapper.writeValueAsBytes(input)))
                .andExpect(status().isCreated()).andExpect(header().exists("Location")).andReturn();
        return mapper.readTree(result.getResponse().getContentAsString()).at("/data/id").asText();
    }

    @Test
    void createsAndReadsARecordPersistedThroughJpaInPostgres() throws Exception {
        String id = create(sample());
        mvc.perform(get("/api/v1/submissions/{id}", id)).andExpect(status().isOk()).andExpect(jsonPath("$.data.first_name").value("Alex")).andExpect(jsonPath("$.data.status").value("submitted"));
        assertThat(jdbc.queryForObject("SELECT first_name FROM submissions WHERE id = ?::uuid", String.class, id)).isEqualTo("Alex");
        assertThat(jdbc.queryForObject("SELECT version()", String.class)).contains("PostgreSQL");
    }

    @Test
    void returnsPersistedTimestampsWithANanosecondClock() throws Exception {
        // Exercise sub-microsecond clock precision even on hosts whose clock is coarser.
        Instant firstTick = Instant.parse("2026-10-28T12:34:56.999999999Z");
        Instant secondTick = firstTick.plusSeconds(1);
        try (MockedStatic<Instant> clock = mockStatic(Instant.class, CALLS_REAL_METHODS)) {
            clock.when(Instant::now).thenReturn(firstTick);

            var createdResult = mvc.perform(post("/api/v1/submissions")
                            .contentType("application/json").content(mapper.writeValueAsBytes(sample())))
                    .andExpect(status().isCreated()).andReturn();
            var created = mapper.readTree(createdResult.getResponse().getContentAsString());
            String id = created.at("/data/id").asText();
            var readResult = mvc.perform(get("/api/v1/submissions/{id}", id))
                    .andExpect(status().isOk()).andReturn();
            assertThat(mapper.readTree(readResult.getResponse().getContentAsString())).isEqualTo(created);

            // A later update changes updated_at, while creation and submission times stay stable.
            clock.when(Instant::now).thenReturn(secondTick);
            var updatedResult = mvc.perform(patch("/api/v1/submissions/{id}", id)
                            .contentType("application/json").content("{\"company\":\"Changed company\"}"))
                    .andExpect(status().isOk()).andReturn();
            var updated = mapper.readTree(updatedResult.getResponse().getContentAsString());
            var rereadResult = mvc.perform(get("/api/v1/submissions/{id}", id))
                    .andExpect(status().isOk()).andReturn();
            assertThat(mapper.readTree(rereadResult.getResponse().getContentAsString())).isEqualTo(updated);
            assertThat(updated.at("/data/created_at")).isEqualTo(created.at("/data/created_at"));
            assertThat(updated.at("/data/submitted_at")).isEqualTo(created.at("/data/submitted_at"));
            assertThat(updated.at("/data/updated_at")).isNotEqualTo(created.at("/data/updated_at"));
        }
    }

    @Test
    void savesAndPromotesAnIncompleteDraftWithoutChangingItsIdentity() throws Exception {
        String id = create(Map.of("status", "draft", "first_name", "Alex"));
        mvc.perform(patch("/api/v1/submissions/{id}", id).contentType("application/json").content("{\"company\":\"Acorn Studio\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("draft"));
        var payload = sample(); payload.put("status", "submitted");
        var result = mvc.perform(patch("/api/v1/submissions/{id}", id).contentType("application/json").content(mapper.writeValueAsBytes(payload)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.id").value(id)).andExpect(jsonPath("$.data.company").value("Acorn Studio")).andExpect(jsonPath("$.data.submitted_at").isNotEmpty()).andReturn();
        String submittedAt = mapper.readTree(result.getResponse().getContentAsString()).at("/data/submitted_at").asText();
        mvc.perform(patch("/api/v1/submissions/{id}", id).contentType("application/json").content("{\"phone\":\"+1 555 010 2040\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.submitted_at").value(submittedAt));
        mvc.perform(patch("/api/v1/submissions/{id}", id).contentType("application/json").content("{\"status\":\"draft\"}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void rejectsInvalidAndIncompleteSubmissionsWithoutWritingRows() throws Exception {
        mvc.perform(post("/api/v1/submissions").contentType("application/json").content("{}"))
                .andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.error.details").isArray());
        var invalid = sample(); invalid.put("email", "invalid");
        mvc.perform(post("/api/v1/submissions").contentType("application/json").content(mapper.writeValueAsBytes(invalid)))
                .andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.error.details[0].field").value("email"));
        assertThat(repository.count()).isZero();
    }

    @Test
    void rejectsUnknownPropertiesAndCoercedScalarTypes() throws Exception {
        for (var entry : Map.<String, Object>of("admin", true, "consent", "true", "first_name", 123).entrySet()) {
            var input = sample(); input.put(entry.getKey(), entry.getValue());
            mvc.perform(post("/api/v1/submissions").contentType("application/json").content(mapper.writeValueAsBytes(input))).andExpect(status().isBadRequest());
        }
    }

    @Test
    void validatesUnicodeMessageLengthBeforeReachingTheDatabaseConstraint() throws Exception {
        var input = sample(); input.put("message", "😀😀😀😀😀");
        mvc.perform(post("/api/v1/submissions").contentType("application/json").content(mapper.writeValueAsBytes(input)))
                .andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.error.details[0].field").value("message"));
        assertThat(repository.count()).isZero();
    }

    @Test
    void searchesAndPaginatesWithLiteralWildcardCharacters() throws Exception {
        create(sample()); create(Map.of("status", "draft", "first_name", "Jamie", "company", "100% Studio"));
        mvc.perform(get("/api/v1/submissions").param("status", "submitted").param("q", "alex"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.meta.total").value(1)).andExpect(jsonPath("$.meta.counts.all").value(2));
        mvc.perform(get("/api/v1/submissions").param("per_page", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(1)).andExpect(jsonPath("$.meta.total_pages").value(2));
        mvc.perform(get("/api/v1/submissions").param("q", "%")).andExpect(status().isOk()).andExpect(jsonPath("$.meta.total").value(1));
        mvc.perform(get("/api/v1/submissions").param("q", "' OR 1=1 --")).andExpect(status().isOk()).andExpect(jsonPath("$.meta.total").value(0));
        for (String query : new String[]{"0", "101"}) mvc.perform(get("/api/v1/submissions").param("per_page", query)).andExpect(status().isBadRequest());
    }

    @Test
    void exportsEscapedCsvAndNeutralizesMultilineSpreadsheetFormulas() throws Exception {
        create(Map.of("status", "draft", "first_name", "=SUM(1,2)", "message", "=HYPERLINK(\"test\")\nsecond line"));
        var response = mvc.perform(get("/api/v1/submissions.csv").param("status", "draft"))
                .andExpect(status().isOk()).andExpect(header().exists("Content-Disposition")).andReturn().getResponse().getContentAsString();
        assertThat(response).contains("\"'=SUM(1,2)\"").contains("\"'=HYPERLINK(\"\"test\"\")\nsecond line\"");
    }

    @Test
    void deletesARecordAndReturnsNotFound() throws Exception {
        String id = create(sample());
        mvc.perform(delete("/api/v1/submissions/{id}", id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/submissions/{id}", id)).andExpect(status().isNotFound());
    }

    @Test
    void providesDiscoverableFormAndOpenApiDefinitions() throws Exception {
        mvc.perform(get("/api/v1/forms/contact")).andExpect(status().isOk()).andExpect(jsonPath("$.data.fields.length()").value(9));
        mvc.perform(get("/openapi.json")).andExpect(status().isOk()).andExpect(jsonPath("$.info.title").value("Formdesk API"))
                .andExpect(jsonPath("$.paths['/api/v1/submissions'].post.operationId").value("createSubmission"))
                .andExpect(jsonPath("$.components.schemas.SubmissionRequest.properties.first_name.maxLength").value(80))
                .andExpect(jsonPath("$.components.schemas.SubmissionResponse.properties.created_at.format").value("date-time"))
                .andExpect(jsonPath("$.components.schemas.Pagination.properties.per_page").exists());
        mvc.perform(get("/api/v1/health")).andExpect(status().isOk()).andExpect(jsonPath("$.data.database").value("postgresql"));
    }

    @Test
    void refusesUntrustedOriginsAndInvalidIdentifiers() throws Exception {
        mvc.perform(post("/api/v1/submissions").header("Origin", "https://untrusted.example").contentType("application/json").content(mapper.writeValueAsBytes(sample()))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/submissions/not-a-uuid")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/submissions").contentType("text/plain").content("bad")).andExpect(status().isUnsupportedMediaType());
    }
}
