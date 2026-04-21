package com.cse214.project.controller;

import com.cse214.project.dto.store.StoreSettingsDto;
import com.cse214.project.service.StoreSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/store-settings")
@RequiredArgsConstructor
public class StoreSettingsController {

    private final StoreSettingsService storeSettingsService;

    @GetMapping
    public ResponseEntity<StoreSettingsDto> getSettings() {
        return ResponseEntity.ok(storeSettingsService.getSettings());
    }

    @PutMapping
    public ResponseEntity<StoreSettingsDto> updateSettings(@RequestBody StoreSettingsDto dto) {
        return ResponseEntity.ok(storeSettingsService.updateSettings(dto));
    }
}