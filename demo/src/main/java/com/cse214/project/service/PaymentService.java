package com.cse214.project.service;

import com.cse214.project.dto.payment.PaymentResponse;
import com.cse214.project.entity.Order;
import com.cse214.project.entity.User;
import com.cse214.project.repository.OrderRepository;
import com.cse214.project.repository.UserRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class PaymentService {

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

    public PaymentResponse createPaymentIntent(Integer orderId, String userEmail) throws StripeException {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Sipariş bulunamadı: " + orderId));

        // Security check
        if ("INDIVIDUAL".equals(user.getRoleType()) && !order.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Yetkiniz dışındaki bir siparişi ödeyemezsiniz.");
        }

        if (!"PENDING".equals(order.getStatus())) {
            throw new RuntimeException("Sadece PENDING durumundaki siparişler ödenebilir.");
        }

        // Stripe requires amount in cents (or equivalent raw integer for currency)
        long amountInCents = order.getGrandTotal().multiply(new BigDecimal("100")).longValue();

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInCents)
                .setCurrency("usd")
                .putMetadata("order_id", order.getId().toString())
                .putMetadata("user_id", user.getId().toString())
                .build();

        PaymentIntent intent = PaymentIntent.create(params);

        return PaymentResponse.builder()
                .clientSecret(intent.getClientSecret())
                .build();
    }
}
