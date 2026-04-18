package com.cse214.project.service;

import com.cse214.project.dto.admin.StoreDto;
import com.cse214.project.dto.admin.UserDto;
import com.cse214.project.entity.Store;
import com.cse214.project.entity.User;
import com.cse214.project.repository.StoreRepository;
import com.cse214.project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;

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
                .build();
    }

    private StoreDto toStoreDto(Store s) {
        return StoreDto.builder()
                .id(s.getId())
                .name(s.getName())
                .status(s.getStatus())
                .ownerName(s.getOwner().getName())
                .ownerEmail(s.getOwner().getEmail())
                .build();
    }
}
