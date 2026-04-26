package com.cse214.project.service;

import com.cse214.project.dto.auth.LoginRequest;
import com.cse214.project.dto.auth.LoginResponse;
import com.cse214.project.entity.User;
import com.cse214.project.exception.UnauthorizedAccessException;
import com.cse214.project.repository.UserRepository;
import com.cse214.project.repository.StoreRepository;
import com.cse214.project.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedAccessException("Erişim reddedildi: Kullanıcı bulunamadı veya şifre hatalı."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedAccessException("Erişim reddedildi: Kullanıcı bulunamadı veya şifre hatalı.");
        }

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        Integer storeId = null;
        if ("CORPORATE".equals(user.getRoleType())) {
            storeId = storeRepository.findByOwnerId(user.getId())
                    .map(store -> store.getId())
                    .orElse(null);
        }

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .role(user.getRoleType())
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .storeId(storeId)
                .build();
    }

    public LoginResponse refresh(String refreshToken) {
        String email = jwtService.extractEmail(refreshToken);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedAccessException("Geçersiz refresh token."));

        if (!jwtService.validateToken(refreshToken, email)) {
            throw new UnauthorizedAccessException("Refresh token süresi dolmuş.");
        }

        String newAccessToken = jwtService.generateToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        Integer storeId = null;
        if ("CORPORATE".equals(user.getRoleType())) {
            storeId = storeRepository.findByOwnerId(user.getId())
                    .map(store -> store.getId())
                    .orElse(null);
        }

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .role(user.getRoleType())
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .storeId(storeId)
                .build();
    }
}
