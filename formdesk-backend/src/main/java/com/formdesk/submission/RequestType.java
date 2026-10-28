package com.formdesk.submission;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Locale;

public enum RequestType {
    GENERAL, PROJECT, FEEDBACK;

    @JsonValue
    public String value() { return name().toLowerCase(Locale.ROOT); }

    @JsonCreator
    public static RequestType parse(String value) {
        return valueOf(value.toUpperCase(Locale.ROOT));
    }
}
