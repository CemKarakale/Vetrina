package com.cse214.project.dto.auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private String role;
    private Integer userId;
    private String name;
    private String email;
    private Integer storeId;
}
