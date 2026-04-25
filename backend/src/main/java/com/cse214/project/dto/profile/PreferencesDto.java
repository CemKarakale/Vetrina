package com.cse214.project.dto.profile;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PreferencesDto {
    private String theme;
    private Boolean notifications;
    private String language;
    private String currency;
}