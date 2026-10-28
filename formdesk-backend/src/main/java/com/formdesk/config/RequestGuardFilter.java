package com.formdesk.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.formdesk.common.ApiModels;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RequestGuardFilter extends OncePerRequestFilter {
    private final Set<String> allowedOrigins;
    private final ObjectMapper mapper;

    public RequestGuardFilter(@Value("${formdesk.allowed-origins}") String origins, ObjectMapper mapper) {
        allowedOrigins = Arrays.stream(origins.split(",")).map(String::trim).collect(Collectors.toSet());
        this.mapper = mapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Referrer-Policy", "same-origin");
        if (request.getRequestURI().startsWith("/api/v1/")) response.setHeader("Cache-Control", "no-store");
        String origin = request.getHeader("Origin");
        String ownOrigin = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();
        if (Set.of("POST", "PATCH", "DELETE", "PUT").contains(request.getMethod()) && origin != null && !origin.equals(ownOrigin) && !allowedOrigins.contains(origin)) {
            response.setStatus(403); response.setContentType("application/json");
            mapper.writeValue(response.getOutputStream(), new ApiModels.ErrorEnvelope(new ApiModels.ErrorBody("invalid_origin", "Use this workspace's origin for changes.", List.of())));
            return;
        }
        chain.doFilter(request, response);
    }
}
