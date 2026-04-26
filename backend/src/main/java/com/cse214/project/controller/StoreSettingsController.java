package com.cse214.project.controller;

import com.cse214.project.dto.store.StoreSettingsDto;
import com.cse214.project.service.StoreSettingsService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/store-settings")
@RequiredArgsConstructor
public class StoreSettingsController {

    private static final Logger log = LoggerFactory.getLogger(StoreSettingsController.class);
    private final StoreSettingsService storeSettingsService;

    @GetMapping
    public ResponseEntity<StoreSettingsDto> getSettings(Authentication authentication) {
        log.info("GET /api/store-settings called by: {}", authentication.getName());
        try {
            StoreSettingsDto result = storeSettingsService.getSettings(authentication.getName());
            log.info("GET returning: {}", result);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error in GET /api/store-settings", e);
            throw e;
        }
    }

    @PutMapping
    public ResponseEntity<StoreSettingsDto> updateSettings(Authentication authentication, @RequestBody StoreSettingsDto dto) {
        log.info("PUT /api/store-settings called by: {}, body: {}", authentication.getName(), dto);
        try {
            StoreSettingsDto result = storeSettingsService.updateSettings(authentication.getName(), dto);
            log.info("PUT returning: {}", result);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error in PUT /api/store-settings", e);
            throw e;
        }
    }
}