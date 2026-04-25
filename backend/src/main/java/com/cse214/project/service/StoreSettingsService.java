package com.cse214.project.service;

import com.cse214.project.dto.store.StoreSettingsDto;
import com.cse214.project.entity.Store;
import com.cse214.project.entity.StoreSettings;
import com.cse214.project.repository.StoreRepository;
import com.cse214.project.repository.StoreSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoreSettingsService {

    private final StoreSettingsRepository storeSettingsRepository;
    private final StoreRepository storeRepository;

    public StoreSettingsDto getSettings() {
        List<StoreSettings> allSettings = storeSettingsRepository.findAll();
        if (allSettings.isEmpty()) {
            return createDefaultSettings();
        }
        return toDto(allSettings.get(0));
    }

    public StoreSettingsDto updateSettings(StoreSettingsDto dto) {
        StoreSettings settings = storeSettingsRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> {
                    Store store = storeRepository.findAll().stream()
                            .findFirst()
                            .orElseThrow(() -> new RuntimeException("No store found"));
                    return StoreSettings.builder().store(store).build();
                });

        if (dto.getEmail() != null) settings.setEmail(dto.getEmail());
        if (dto.getCategory() != null) settings.setCategory(dto.getCategory());
        if (dto.getDescription() != null) settings.setDescription(dto.getDescription());
        if (dto.getCurrency() != null) settings.setCurrency(dto.getCurrency());
        if (dto.getTimezone() != null) settings.setTimezone(dto.getTimezone());

        return toDto(storeSettingsRepository.save(settings));
    }

    private StoreSettingsDto toDto(StoreSettings settings) {
        Store store = settings.getStore();
        return StoreSettingsDto.builder()
                .id(settings.getId())
                .storeId(store.getId())
                .storeName(store.getName())
                .email(settings.getEmail())
                .status(store.getStatus())
                .category(settings.getCategory())
                .description(settings.getDescription())
                .currency(settings.getCurrency())
                .timezone(settings.getTimezone())
                .build();
    }

    private StoreSettingsDto createDefaultSettings() {
        Store defaultStore = storeRepository.findAll().stream()
                .findFirst()
                .orElse(null);

        return StoreSettingsDto.builder()
                .storeName(defaultStore != null ? defaultStore.getName() : "My Store")
                .status(defaultStore != null ? defaultStore.getStatus() : "Open")
                .email("admin@store.com")
                .category("General")
                .description("Welcome to our store")
                .currency("USD ($)")
                .timezone("America/New_York")
                .build();
    }
}