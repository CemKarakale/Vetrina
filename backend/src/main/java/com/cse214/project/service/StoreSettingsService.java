package com.cse214.project.service;

import com.cse214.project.dto.store.StoreSettingsDto;
import com.cse214.project.entity.Store;
import com.cse214.project.entity.StoreSettings;
import com.cse214.project.entity.User;
import com.cse214.project.repository.StoreRepository;
import com.cse214.project.repository.StoreSettingsRepository;
import com.cse214.project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StoreSettingsService {

    private final StoreSettingsRepository storeSettingsRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;

    public StoreSettingsDto getSettings(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));

        Store store = getStoreForUser(user);
        StoreSettings settings = storeSettingsRepository.findByStoreId(store.getId())
                .orElseGet(() -> createDefaultSettings(store));

        return toDto(settings);
    }

    @Transactional
    public StoreSettingsDto updateSettings(String userEmail, StoreSettingsDto dto) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));

        Store store = getStoreForUser(user);

        StoreSettings settings = storeSettingsRepository.findByStoreId(store.getId())
                .orElseGet(() -> StoreSettings.builder().store(store).build());

        if (dto.getEmail() != null) settings.setEmail(dto.getEmail());
        if (dto.getCategory() != null) settings.setCategory(dto.getCategory());
        if (dto.getDescription() != null) settings.setDescription(dto.getDescription());
        if (dto.getCurrency() != null) settings.setCurrency(dto.getCurrency());
        if (dto.getTimezone() != null) settings.setTimezone(dto.getTimezone());

        return toDto(storeSettingsRepository.save(settings));
    }

    private Store getStoreForUser(User user) {
        if ("CORPORATE".equals(user.getRoleType())) {
            return storeRepository.findFirstByOwnerId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Kullanıcının mağazası bulunamadı."));
        }
        return storeRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Sistemde mağaza bulunamadı."));
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

    private StoreSettings createDefaultSettings(Store store) {
        return StoreSettings.builder()
                .store(store)
                .email("admin@store.com")
                .category("General")
                .description("Welcome to our store")
                .currency("USD")
                .timezone("UTC")
                .build();
    }
}