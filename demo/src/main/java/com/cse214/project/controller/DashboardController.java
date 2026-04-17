package com.cse214.project.controller;

import com.cse214.project.dto.dashboard.DashboardSummaryDto;
import com.cse214.project.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDto> getSummary(Authentication auth) {
        return ResponseEntity.ok(dashboardService.getSummary(auth.getName()));
    }
}
