package com.cse214.project.service;

import com.cse214.project.dto.auth.LoginRequest;
import com.cse214.project.dto.auth.LoginResponse;
import com.cse214.project.entity.User;
import com.cse214.project.exception.UnauthorizedAccessException;
import com.cse214.project.repository.UserRepository;
import com.cse214.project.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedAccessException("Erişim reddedildi: Kullanıcı bulunamadı veya şifre hatalı."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedAccessException("Erişim reddedildi: Kullanıcı bulunamadı veya şifre hatalı.");
        }

        String token = jwtService.generateToken(user);

        return LoginResponse.builder()
                .accessToken(token)
                .role(user.getRoleType())
                .userId(user.getId())
                .name(user.getName())
                .build();
    }
}
