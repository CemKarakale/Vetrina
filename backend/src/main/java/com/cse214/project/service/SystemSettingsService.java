package com.cse214.project.service;

import com.cse214.project.entity.SystemSettings;
import com.cse214.project.repository.SystemSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SystemSettingsService {

    private final SystemSettingsRepository settingsRepository;

    private static final Map<String, String> DEFAULT_SETTINGS = new HashMap<>();
    static {
        DEFAULT_SETTINGS.put("platformName", "E-Commerce Platform");
        DEFAULT_SETTINGS.put("defaultCurrency", "USD");
        DEFAULT_SETTINGS.put("maintenanceMode", "false");
        DEFAULT_SETTINGS.put("commissionRate", "10");
        DEFAULT_SETTINGS.put("supportEmail", "support@example.com");
        DEFAULT_SETTINGS.put("allowStoreRegistration", "true");
    }

    public Map<String, String> getAllSettings() {
        List<SystemSettings> settings = settingsRepository.findAll();
        Map<String, String> result = new HashMap<>(DEFAULT_SETTINGS);
        for (SystemSettings s : settings) {
            result.put(s.getSettingKey(), s.getSettingValue());
        }
        return result;
    }

    public Map<String, String> updateSettings(Map<String, String> updates) {
        for (Map.Entry<String, String> entry : updates.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();

            SystemSettings setting = settingsRepository.findBySettingKey(key)
                    .orElse(SystemSettings.builder()
                            .settingKey(key)
                            .description("System setting: " + key)
                            .build());

            setting.setSettingValue(value);
            settingsRepository.save(setting);
        }
        return getAllSettings();
    }
}