package com.cse214.project.service;

import com.cse214.project.dto.admin.CreateUserRequest;
import com.cse214.project.dto.admin.StoreDto;
import com.cse214.project.dto.admin.UpdateUserStatusRequest;
import com.cse214.project.dto.admin.UserDto;
import com.cse214.project.entity.Store;
import com.cse214.project.entity.User;
import com.cse214.project.repository.OrderRepository;
import com.cse214.project.repository.ProductRepository;
import com.cse214.project.repository.StoreRepository;
import com.cse214.project.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    // ==================== USER MANAGEMENT ====================

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toUserDto)
                .collect(Collectors.toList());
    }

    public UserDto getUserById(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + id));
        return toUserDto(user);
    }

    public void deleteUser(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + id));

        if ("ADMIN".equals(user.getRoleType())) {
            throw new RuntimeException("Admin kullanıcılar silinemez.");
        }

        userRepository.delete(user);
    }

    public UserDto createUser(CreateUserRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Bu email zaten kullanılmaktadır.");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .roleType(request.getRoleType())
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .build();

        User saved = userRepository.save(user);
        return toUserDto(saved);
    }

    public UserDto updateUser(Integer id, CreateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + id));

        if (request.getName() != null) user.setName(request.getName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getRoleType() != null) user.setRoleType(request.getRoleType());
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        User saved = userRepository.save(user);
        return toUserDto(saved);
    }

    public UserDto updateUserStatus(Integer id, UpdateUserStatusRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı: " + id));

        if ("ADMIN".equals(user.getRoleType()) && "DELETED".equals(request.getStatus())) {
            throw new RuntimeException("Admin kullanıcılar silinemez.");
        }

        user.setStatus(request.getStatus());
        User saved = userRepository.save(user);
        return toUserDto(saved);
    }

    // ==================== STORE MANAGEMENT ====================

    public List<StoreDto> getAllStores() {
        return storeRepository.findAll().stream()
                .map(this::toStoreDto)
                .collect(Collectors.toList());
    }

    public StoreDto updateStoreStatus(Integer id, String status) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mağaza bulunamadı: " + id));

        store.setStatus(status);
        Store saved = storeRepository.save(store);
        return toStoreDto(saved);
    }

    // ==================== MAPPERS ====================

    private UserDto toUserDto(User u) {
        return UserDto.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .roleType(u.getRoleType())
                .status(u.getStatus())
                .createdAt(u.getCreatedAt())
                .lastLoginAt(u.getLastLoginAt())
                .build();
    }

    private StoreDto toStoreDto(Store s) {
        int productCount = productRepository.findByStoreId(s.getId()).size();
        long orderCount = orderRepository.findByStoreId(s.getId()).size();

        return StoreDto.builder()
                .id(s.getId())
                .name(s.getName())
                .status(s.getStatus())
                .ownerName(s.getOwner().getName())
                .ownerEmail(s.getOwner().getEmail())
                .productCount(productCount)
                .orderCount(orderCount)
                .build();
    }
}
