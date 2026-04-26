package com.cse214.project.config;

import com.cse214.project.entity.Store;
import com.cse214.project.entity.User;
import com.cse214.project.repository.StoreRepository;
import com.cse214.project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {

        syncUserPasswords();
        syncStorePasswords();
        System.out.println("✅ DataSeeder tamamlandı - Sadece password senkronizasyonu yapıldı.");
    }

    private void syncUserPasswords() {
        List<String> seedEmails = List.of(
                "admin@test.com",
                "corp@test.com",
                "user1@test.com",
                "user2@test.com");

        for (String email : seedEmails) {
            userRepository.findByEmail(email).ifPresent(user -> {
                user.setPasswordHash(passwordEncoder.encode("123456"));
                userRepository.save(user);
                System.out.println("  → Senkronize edildi: " + email);
            });
        }
    }

    private void syncStorePasswords() {
        storeRepository.findAll().forEach(store -> {
            User owner = store.getOwner();
            if (owner != null && "CORPORATE".equals(owner.getRoleType())) {
                owner.setPasswordHash(passwordEncoder.encode("123456"));
                userRepository.save(owner);
                System.out.println("  → Store owner senkronize edildi: " + owner.getEmail());
            }
        });
    }
}
