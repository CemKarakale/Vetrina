package com.cse214.project.service;

import com.cse214.project.dto.admin.AuditLogDto;
import com.cse214.project.entity.AuditLog;
import com.cse214.project.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public List<AuditLogDto> getAuditLogs(LocalDate from, LocalDate to, String actor, String type, String severity) {
        LocalDateTime fromDt = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDt = to != null ? to.atTime(LocalTime.MAX) : null;

        List<AuditLog> logs = auditLogRepository.findByFilters(fromDt, toDt, actor, type, severity);
        return logs.stream().map(this::toDto).collect(Collectors.toList());
    }

    public void log(String actor, String action, String entityType, Integer entityId, String severity, String metadata) {
        AuditLog log = AuditLog.builder()
                .actor(actor)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .severity(severity)
                .createdAt(LocalDateTime.now())
                .metadata(metadata)
                .build();
        auditLogRepository.save(log);
    }

    public List<AuditLogDto> getRecentLogs() {
        return auditLogRepository.findTop50ByOrderByCreatedAtDesc()
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    private AuditLogDto toDto(AuditLog l) {
        return AuditLogDto.builder()
                .id(l.getId())
                .actor(l.getActor())
                .action(l.getAction())
                .entityType(l.getEntityType())
                .entityId(l.getEntityId())
                .severity(l.getSeverity())
                .createdAt(l.getCreatedAt())
                .metadata(l.getMetadata())
                .build();
    }
}