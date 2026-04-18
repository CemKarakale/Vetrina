package com.cse214.project.config;

import com.cse214.project.entity.Store;
import com.cse214.project.entity.User;
import com.cse214.project.repository.StoreRepository;
import com.cse214.project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {

        // ===== 1. Admin Kullanıcı =====
        User admin = seedUser("Admin User", "admin@test.com", "123456", "ADMIN");

        // ===== 2. Corporate Kullanıcı =====
        User corp = seedUser("Corporate User", "corp@test.com", "123456", "CORPORATE");

        // ===== 3. Individual Kullanıcılar =====
        seedUser("User One", "user1@test.com", "123456", "INDIVIDUAL");
        seedUser("User Two", "user2@test.com", "123456", "INDIVIDUAL");

        // ===== 4. Corporate kullanıcı için mağaza =====
        if (corp != null && storeRepository.findByOwnerId(corp.getId()).isEmpty()) {
            Store store = Store.builder()
                    .name("Corp Test Store")
                    .owner(corp)
                    .status("ACTIVE")
                    .build();
            storeRepository.save(store);
            System.out.println("  → Mağaza oluşturuldu: Corp Test Store (owner: corp@test.com)");
        }

        System.out.println("✅ DataSeeder tamamlandı.");
    }

    private User seedUser(String name, String email, String rawPassword, String roleType) {
        return userRepository.findByEmail(email).map(existingUser -> {
            // Mevcut kullanıcının şifresini Java BCrypt ile senkronize et
            existingUser.setPasswordHash(passwordEncoder.encode(rawPassword));
            existingUser.setRoleType(roleType);
            userRepository.save(existingUser);
            System.out.println("  → Senkronize edildi: " + email + " (" + roleType + ")");
            return existingUser;
        }).orElseGet(() -> {
            // Kullanıcı yoksa oluştur
            User newUser = User.builder()
                    .name(name)
                    .email(email)
                    .passwordHash(passwordEncoder.encode(rawPassword))
                    .roleType(roleType)
                    .build();
            userRepository.save(newUser);
            System.out.println("  → Oluşturuldu: " + email + " (" + roleType + ")");
            return newUser;
        });
    }
}
