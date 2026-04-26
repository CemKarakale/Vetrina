package com.cse214.project.dto.admin;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AuditLogDto {
    private Integer id;
    private String actor;
    private String action;
    private String entityType;
    private Integer entityId;
    private String severity;
    private LocalDateTime createdAt;
    private String metadata;
}