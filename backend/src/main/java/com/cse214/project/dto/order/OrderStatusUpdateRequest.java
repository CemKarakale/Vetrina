package com.cse214.project.dto.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class OrderStatusUpdateRequest {

    @NotBlank(message = "Durum boş olamaz")
    @Pattern(regexp = "PENDING|CONFIRMED|SHIPPED|DELIVERED|CANCELLED",
             message = "Geçerli durumlar: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED")
    private String status;
}
