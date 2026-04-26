package com.cse214.project.controller;

import com.cse214.project.dto.payment.PaymentIntentRequest;
import com.cse214.project.dto.payment.PaymentResponse;
import com.cse214.project.service.PaymentService;
import com.stripe.exception.StripeException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-intent")
    public ResponseEntity<PaymentResponse> createPaymentIntent(
            @Valid @RequestBody PaymentIntentRequest request,
            Authentication auth) throws StripeException {
        return ResponseEntity.ok(paymentService.createPaymentIntent(request.getOrderId(), auth.getName()));
    }
}
