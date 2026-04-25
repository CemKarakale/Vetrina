package com.cse214.project.controller;

import com.cse214.project.dto.dashboard.DashboardModels.*;
import com.cse214.project.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/dashboard/user")
    public ResponseEntity<UserDashboardDto> getUserDashboard(Authentication auth, @RequestParam(defaultValue = "30d") String range) {
        return ResponseEntity.ok(dashboardService.getUserDashboard(auth.getName(), range));
    }

    @GetMapping("/dashboard/corporate")
    public ResponseEntity<CorporateDashboardDto> getCorporateDashboard(Authentication auth, @RequestParam(defaultValue = "30d") String range) {
        return ResponseEntity.ok(dashboardService.getCorporateDashboard(auth.getName(), range));
    }

    @GetMapping("/dashboard/admin")
    public ResponseEntity<AdminDashboardDto> getAdminDashboard(Authentication auth, @RequestParam(defaultValue = "30d") String range) {
        return ResponseEntity.ok(dashboardService.getAdminDashboard(auth.getName(), range));
    }
}
