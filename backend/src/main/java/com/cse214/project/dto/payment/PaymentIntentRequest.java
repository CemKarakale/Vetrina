package com.cse214.project.dto.payment;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentIntentRequest {
    @NotNull(message = "Sipariş ID boş olamaz")
    private Integer orderId;
}
