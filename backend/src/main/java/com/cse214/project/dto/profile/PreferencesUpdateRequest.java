package com.cse214.project.dto.profile;

import lombok.Data;

@Data
public class PreferencesUpdateRequest {
    private String theme;
    private Boolean notifications;
    private String language;
    private String currency;
}