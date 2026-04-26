package com.cse214.project.controller;

import com.cse214.project.dto.profile.PreferencesUpdateRequest;
import com.cse214.project.dto.profile.ProfileDto;
import com.cse214.project.dto.profile.ProfileUpdateRequest;
import com.cse214.project.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile/me")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ResponseEntity<ProfileDto> getCurrentProfile(Authentication authentication) {
        return ResponseEntity.ok(profileService.getCurrentUserProfile(authentication.getName()));
    }

    @PutMapping
    public ResponseEntity<ProfileDto> updateProfile(Authentication authentication, @RequestBody ProfileUpdateRequest request) {
        return ResponseEntity.ok(profileService.updateProfile(authentication.getName(), request));
    }

    @PatchMapping("/preferences")
    public ResponseEntity<ProfileDto> updatePreferences(Authentication authentication, @RequestBody PreferencesUpdateRequest request) {
        return ResponseEntity.ok(profileService.updatePreferences(authentication.getName(), request));
    }
}
