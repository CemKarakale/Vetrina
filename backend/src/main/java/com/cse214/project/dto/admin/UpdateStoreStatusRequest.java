package com.cse214.project.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateStoreStatusRequest {

    @NotBlank(message = "Durum boş olamaz")
    @Pattern(regexp = "ACTIVE|CLOSED|SUSPENDED", message = "Durum ACTIVE, CLOSED veya SUSPENDED olmalı")
    private String status;
}
