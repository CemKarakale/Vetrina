package com.cse214.project.controller;

import com.cse214.project.dto.admin.AuditLogDto;
import com.cse214.project.dto.admin.CreateStoreRequest;
import com.cse214.project.dto.admin.CreateUserRequest;
import com.cse214.project.dto.admin.StoreDto;
import com.cse214.project.dto.admin.StoreReportDto;
import com.cse214.project.dto.admin.UpdateStoreStatusRequest;
import com.cse214.project.dto.admin.UpdateUserStatusRequest;
import com.cse214.project.dto.admin.UserDto;
import com.cse214.project.service.AdminService;
import com.cse214.project.service.AuditLogService;
import com.cse214.project.service.CustomerService;
import com.cse214.project.service.ReportService;
import com.cse214.project.service.SystemSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final AuditLogService auditLogService;
    private final SystemSettingsService systemSettingsService;
    private final ReportService reportService;
    private final CustomerService customerService;

    // ==================== USER MANAGEMENT ====================

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Integer id) {
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    @PostMapping("/users")
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createUser(request));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable Integer id, @Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(adminService.updateUser(id, request));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<UserDto> updateUserStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        return ResponseEntity.ok(adminService.updateUserStatus(id, request));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== STORE MANAGEMENT ====================

    @GetMapping("/stores")
    public ResponseEntity<List<StoreDto>> getAllStores() {
        return ResponseEntity.ok(adminService.getAllStores());
    }

    @PostMapping("/stores")
    public ResponseEntity<StoreDto> createStore(@Valid @RequestBody CreateStoreRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createStore(request));
    }

    @PutMapping("/stores/{id}/status")
    public ResponseEntity<StoreDto> updateStoreStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateStoreStatusRequest request) {
        return ResponseEntity.ok(adminService.updateStoreStatus(id, request.getStatus()));
    }

    // ==================== AUDIT LOGS ====================

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLogDto>> getAuditLogs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String severity) {
        return ResponseEntity.ok(auditLogService.getAuditLogs(from, to, actor, type, severity));
    }

    // ==================== SYSTEM SETTINGS ====================

    @GetMapping("/system-settings")
    public ResponseEntity<Map<String, String>> getSystemSettings() {
        return ResponseEntity.ok(systemSettingsService.getAllSettings());
    }

    @PutMapping("/system-settings")
    public ResponseEntity<Map<String, String>> updateSystemSettings(@RequestBody Map<String, String> settings) {
        return ResponseEntity.ok(systemSettingsService.updateSettings(settings));
    }

    // ==================== CROSS-STORE REPORTS ====================

    @GetMapping("/reports/stores")
    public ResponseEntity<List<StoreReportDto>> getStoreReports(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "revenue") String sortBy) {
        return ResponseEntity.ok(reportService.getStoreReports(from, to, sortBy));
    }

    // ==================== CUSTOMER SEGMENTS ====================

    @GetMapping("/customers/segments")
    public ResponseEntity<List<Map<String, Object>>> getCustomerSegments() {
        return ResponseEntity.ok(customerService.getCustomerSegments());
    }
}
