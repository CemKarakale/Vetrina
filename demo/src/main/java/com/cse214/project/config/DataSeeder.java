package com.cse214.project.config;

import com.cse214.project.entity.User;
import com.cse214.project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        userRepository.findByEmail("admin@test.com").ifPresentOrElse(
                user -> {
                    // Eğer kullanıcı Python SQL'i tarafından oluşturulmuşsa, şifresinin hash'ini Java ile güncelliyoruz (Hash uyumsuzluğunu %100 çözer)
                    user.setPasswordHash(passwordEncoder.encode("123456"));
                    userRepository.save(user);
                    System.out.println("Mevcut Admin hesabının şifresi Spring BCrypt ile senkronize edildi!");
                },
                () -> {
                    // Eğer veritabanı tamamen boşsa yeni Admin oluşturur
                    User admin = User.builder()
                            .name("Admin User")
                            .email("admin@test.com")
                            .passwordHash(passwordEncoder.encode("123456"))
                            .roleType("ADMIN")
                            .build();
                    userRepository.save(admin);
                    System.out.println("Örnek Admin hesabı Java tarafından sıfırdan oluşturuldu!");
                }
        );
    }
}
