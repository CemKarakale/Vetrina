package com.cse214.project.repository;

import com.cse214.project.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:from IS NULL OR a.createdAt >= :from) AND " +
           "(:to IS NULL OR a.createdAt <= :to) AND " +
           "(:actor IS NULL OR a.actor = :actor) AND " +
           "(:type IS NULL OR a.entityType = :type) AND " +
           "(:severity IS NULL OR a.severity = :sever) " +
           "ORDER BY a.createdAt DESC")
    List<AuditLog> findByFilters(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("actor") String actor,
            @Param("type") String type,
            @Param("sever") String severity);

    List<AuditLog> findTop50ByOrderByCreatedAtDesc();
}