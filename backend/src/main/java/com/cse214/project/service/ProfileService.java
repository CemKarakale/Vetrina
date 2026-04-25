package com.cse214.project.service;

import com.cse214.project.dto.profile.AddressDto;
import com.cse214.project.dto.profile.PreferencesDto;
import com.cse214.project.dto.profile.PreferencesUpdateRequest;
import com.cse214.project.dto.profile.ProfileDto;
import com.cse214.project.dto.profile.ProfileUpdateRequest;
import com.cse214.project.entity.User;
import com.cse214.project.exception.EmailConflictException;
import com.cse214.project.exception.UnauthorizedAccessException;
import com.cse214.project.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public ProfileDto getCurrentUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedAccessException("Kullanıcı bulunamadı."));
        return toProfileDto(user);
    }

    @Transactional
    public ProfileDto updateProfile(String email, ProfileUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedAccessException("Kullanıcı bulunamadı."));

        if (request.getFirstName() != null) {
            user.setName(request.getFirstName() + (request.getLastName() != null ? " " + request.getLastName() : ""));
        }
        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getEmail() != null) {
            if (!request.getEmail().equals(email) && userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new EmailConflictException("Bu email adresi başka bir hesap tarafından kullanılıyor.");
            }
            user.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getAddress() != null) {
            user.setAddressStreet(request.getAddress().getStreet());
            user.setAddressCity(request.getAddress().getCity());
            user.setAddressState(request.getAddress().getState());
            user.setAddressZipCode(request.getAddress().getZipCode());
            user.setAddressCountry(request.getAddress().getCountry());
        }
        if (request.getPreferences() != null) {
            savePreferences(user, request.getPreferences());
        }

        User saved = userRepository.save(user);
        return toProfileDto(saved);
    }

    @Transactional
    public ProfileDto updatePreferences(String email, PreferencesUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedAccessException("Kullanıcı bulunamadı."));

        PreferencesDto current = getPreferences(user);
        if (request.getTheme() != null) current.setTheme(request.getTheme());
        if (request.getNotifications() != null) current.setNotifications(request.getNotifications());
        if (request.getLanguage() != null) current.setLanguage(request.getLanguage());
        if (request.getCurrency() != null) current.setCurrency(request.getCurrency());

        savePreferences(user, current);
        User saved = userRepository.save(user);
        return toProfileDto(saved);
    }

    private PreferencesDto getPreferences(User user) {
        if (user.getPreferences() == null || user.getPreferences().isBlank()) {
            return PreferencesDto.builder()
                    .theme("light")
                    .notifications(true)
                    .language("English")
                    .currency("USD")
                    .build();
        }
        try {
            return objectMapper.readValue(user.getPreferences(), PreferencesDto.class);
        } catch (JsonProcessingException e) {
            return PreferencesDto.builder().build();
        }
    }

    private void savePreferences(User user, PreferencesDto prefs) {
        try {
            user.setPreferences(objectMapper.writeValueAsString(prefs));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize preferences");
        }
    }

    private ProfileDto toProfileDto(User user) {
        AddressDto address = null;
        if (user.getAddressStreet() != null || user.getAddressCity() != null) {
            address = AddressDto.builder()
                    .street(user.getAddressStreet())
                    .city(user.getAddressCity())
                    .state(user.getAddressState())
                    .zipCode(user.getAddressZipCode())
                    .country(user.getAddressCountry())
                    .build();
        }

        String[] nameParts = user.getName() != null ? user.getName().split(" ", 2) : new String[]{user.getName(), ""};

        return ProfileDto.builder()
                .id(user.getId())
                .firstName(nameParts[0])
                .lastName(nameParts.length > 1 ? nameParts[1] : "")
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRoleType())
                .address(address)
                .preferences(getPreferences(user))
                .build();
    }
}