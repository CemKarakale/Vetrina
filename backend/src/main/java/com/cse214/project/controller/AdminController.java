package com.cse214.project.controller;

import com.cse214.project.dto.admin.StoreDto;
import com.cse214.project.dto.admin.UpdateStoreStatusRequest;
import com.cse214.project.dto.admin.UserDto;
import com.cse214.project.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // ==================== USER MANAGEMENT ====================

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Integer id) {
        return ResponseEntity.ok(adminService.getUserById(id));
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

    @PutMapping("/stores/{id}/status")
    public ResponseEntity<StoreDto> updateStoreStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateStoreStatusRequest request) {
        return ResponseEntity.ok(adminService.updateStoreStatus(id, request.getStatus()));
    }
}
