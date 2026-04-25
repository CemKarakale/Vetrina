package com.cse214.project.dto.admin;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class UserDto {
    private Integer id;
    private String name;
    private String email;
    private String roleType;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
}
