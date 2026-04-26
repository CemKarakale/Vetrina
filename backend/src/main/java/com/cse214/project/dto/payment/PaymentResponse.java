package com.cse214.project.dto.payment;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentResponse {
    private String clientSecret;
    private String stripeAccountId; // Optional: If we were doing Connect, nice to have
}
