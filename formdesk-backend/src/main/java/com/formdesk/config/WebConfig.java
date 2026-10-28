package com.formdesk.config;

import com.fasterxml.jackson.databind.cfg.CoercionAction;
import com.fasterxml.jackson.databind.cfg.CoercionInputShape;
import com.fasterxml.jackson.databind.type.LogicalType;
import com.formdesk.submission.SubmissionStatus;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.format.FormatterRegistry;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final String[] origins;
    public WebConfig(@Value("${formdesk.allowed-origins}") String origins) { this.origins = Arrays.stream(origins.split(",")).map(String::trim).toArray(String[]::new); }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**").allowedOrigins(origins).allowedMethods("GET", "POST", "PATCH", "DELETE", "OPTIONS").allowedHeaders("Content-Type").exposedHeaders("Location");
    }

    @Override
    public void addFormatters(FormatterRegistry registry) { registry.addConverter(String.class, SubmissionStatus.class, SubmissionStatus::parse); }

    @Bean
    OpenAPI apiDescription() { return new OpenAPI().info(new Info().title("Formdesk API").version("1.0.0").description("Local form workspace backed by Spring Data JPA and PostgreSQL. Authentication is required before any remote deployment.")); }

    @Bean
    Jackson2ObjectMapperBuilderCustomizer strictFieldTypes() {
        return builder -> builder.postConfigurer(mapper -> {
            for (var shape : new CoercionInputShape[]{CoercionInputShape.Integer, CoercionInputShape.Float, CoercionInputShape.Boolean}) mapper.coercionConfigFor(LogicalType.Textual).setCoercion(shape, CoercionAction.Fail);
            mapper.coercionConfigFor(LogicalType.Boolean).setCoercion(CoercionInputShape.String, CoercionAction.Fail);
            mapper.coercionConfigFor(LogicalType.Boolean).setCoercion(CoercionInputShape.Integer, CoercionAction.Fail);
        });
    }
}
