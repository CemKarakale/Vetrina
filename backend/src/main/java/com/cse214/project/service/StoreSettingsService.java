package com.cse214.project.service;

import com.cse214.project.dto.store.StoreSettingsDto;
import com.cse214.project.entity.Store;
import com.cse214.project.entity.StoreSettings;
import com.cse214.project.entity.User;
import com.cse214.project.exception.UnauthorizedAccessException;
import com.cse214.project.repository.StoreRepository;
import com.cse214.project.repository.StoreSettingsRepository;
import com.cse214.project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StoreSettingsService {

    private static final Logger log = LoggerFactory.getLogger(StoreSettingsService.class);

    private final StoreSettingsRepository storeSettingsRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;

    public StoreSettingsDto getSettings(String userEmail) {
        log.info("getSettings called for user: {}", userEmail);
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedAccessException("Kullanıcı bulunamadı."));

        Store store = getStoreForUser(user);
        log.info("Store found: id={}, name={}", store.getId(), store.getName());

        StoreSettings settings = storeSettingsRepository.findByStoreId(store.getId())
                .orElseGet(() -> {
                    log.info("No existing settings for store {}, creating new", store.getId());
                    return StoreSettings.builder().store(store).build();
                });

        return toDto(settings);
    }

    @Transactional
    public StoreSettingsDto updateSettings(String userEmail, StoreSettingsDto dto) {
        log.info("updateSettings called for user: {}, dto: {}", userEmail, dto);
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UnauthorizedAccessException("Kullanıcı bulunamadı."));
        log.info("User found: {}, roleType: {}", user.getEmail(), user.getRoleType());

        Store store = getStoreForUser(user);
        log.info("Store found: id={}, name={}", store.getId(), store.getName());

        if (dto.getStoreName() != null && !dto.getStoreName().isEmpty()) {
            log.info("Updating store name from {} to {}", store.getName(), dto.getStoreName());
            store.setName(dto.getStoreName());
            storeRepository.save(store);
            log.info("Store name updated");
        }

        if (dto.getStatus() != null && !dto.getStatus().isEmpty()) {
            log.info("Updating store status from {} to {}", store.getStatus(), dto.getStatus());
            store.setStatus(dto.getStatus());
            storeRepository.save(store);
            log.info("Store status updated");
        }

        StoreSettings settings = storeSettingsRepository.findByStoreId(store.getId())
                .orElseGet(() -> {
                    log.info("No existing settings for store {}, creating new", store.getId());
                    return StoreSettings.builder().store(store).build();
                });
        log.info("Settings before update: id={}, email={}, category={}",
                settings.getId(), settings.getEmail(), settings.getCategory());

        if (dto.getEmail() != null) {
            settings.setEmail(dto.getEmail());
            log.info("Setting email to: {}", dto.getEmail());
        }
        if (dto.getCategory() != null) {
            settings.setCategory(dto.getCategory());
            log.info("Setting category to: {}", dto.getCategory());
        }
        if (dto.getDescription() != null) {
            settings.setDescription(dto.getDescription());
            log.info("Setting description to: {}", dto.getDescription());
        }
        if (dto.getCurrency() != null) {
            settings.setCurrency(dto.getCurrency());
            log.info("Setting currency to: {}", dto.getCurrency());
        }
        if (dto.getTimezone() != null) {
            settings.setTimezone(dto.getTimezone());
            log.info("Setting timezone to: {}", dto.getTimezone());
        }

        log.info("Saving settings with email={}, category={}", settings.getEmail(), settings.getCategory());
        StoreSettings saved = storeSettingsRepository.save(settings);
        log.info("Settings saved successfully, id={}", saved.getId());

        return toDto(saved);
    }

    private Store getStoreForUser(User user) {
        if ("CORPORATE".equals(user.getRoleType())) {
            return storeRepository.findFirstByOwnerId(user.getId())
                    .orElseThrow(() -> new UnauthorizedAccessException("Kullanıcının mağazası bulunamadı."));
        }
        throw new UnauthorizedAccessException("Mağaza ayarlarını güncellemek için CORPORATE rolü gerekli.");
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