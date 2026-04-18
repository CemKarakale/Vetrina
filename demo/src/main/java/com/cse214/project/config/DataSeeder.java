package com.cse214.project.config;

import com.cse214.project.entity.Store;
import com.cse214.project.entity.User;
import com.cse214.project.repository.StoreRepository;
import com.cse214.project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.cse214.project.entity.Category;
import com.cse214.project.entity.Product;
import com.cse214.project.repository.CategoryRepository;
import com.cse214.project.repository.ProductRepository;
import java.math.BigDecimal;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {

        // ===== 1. Admin Kullanıcı =====
        seedUser("Admin User", "admin@test.com", "123456", "ADMIN");

        // ===== 2. Corporate Kullanıcı =====
        User corp = seedUser("Corporate User", "corp@test.com", "123456", "CORPORATE");

        // ===== 3. Individual Kullanıcılar =====
        seedUser("User One", "user1@test.com", "123456", "INDIVIDUAL");
        seedUser("User Two", "user2@test.com", "123456", "INDIVIDUAL");

        // ===== 4. Corporate kullanıcı için mağaza =====
        Store store = storeRepository.findByOwnerId(corp.getId()).orElse(null);
        if (corp != null && store == null) {
            store = Store.builder()
                    .name("Corp Test Store")
                    .owner(corp)
                    .status("ACTIVE")
                    .build();
            store = storeRepository.save(store);
            System.out.println("  → Mağaza oluşturuldu: Corp Test Store (owner: corp@test.com)");
        }

        // ===== 5. Test Kategorileri ve Ürünleri =====
        if (categoryRepository.count() == 0) {
            Category electronics = categoryRepository.save(Category.builder().name("Elektronik").build());
            Category clothing = categoryRepository.save(Category.builder().name("Giyim").build());
            
            if (productRepository.count() == 0 && store != null) {
                productRepository.save(Product.builder()
                        .name("Oyuncu Bilgisayarı")
                        .sku("PC-1001")
                        .description("32GB RAM, RTX 4070")
                        .unitPrice(new BigDecimal("45000.00"))
                        .store(store)
                        .category(electronics)
                        .build());
                        
                productRepository.save(Product.builder()
                        .name("Akıllı Telefon")
                        .sku("PH-2002")
                        .description("128GB Hafıza, Çift Kamera")
                        .unitPrice(new BigDecimal("21000.00"))
                        .store(store)
                        .category(electronics)
                        .build());
                        
                productRepository.save(Product.builder()
                        .name("Pamuklu Tişört")
                        .sku("TS-3003")
                        .description("L Beden, Siyah, %100 Pamuk")
                        .unitPrice(new BigDecimal("250.00"))
                        .store(store)
                        .category(clothing)
                        .build());
                        
                System.out.println("  → Test Kategorileri ve Ürünleri DB'ye eklendi.");
            }
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
