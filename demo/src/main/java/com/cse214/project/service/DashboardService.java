package com.cse214.project.service;

import com.cse214.project.dto.dashboard.DashboardSummaryDto;
import com.cse214.project.entity.Order;
import com.cse214.project.entity.Store;
import com.cse214.project.entity.User;
import com.cse214.project.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;

    public DashboardSummaryDto getSummary(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();

        long totalProducts;
        long totalOrders;
        BigDecimal totalRevenue;
        long totalReviews;

        switch (user.getRoleType()) {
            case "ADMIN":
                totalProducts = productRepository.count();
                totalOrders = orderRepository.count();
                totalRevenue = orderRepository.findAll().stream()
                        .map(Order::getGrandTotal)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                totalReviews = reviewRepository.count();
                break;

            case "CORPORATE":
                Store store = storeRepository.findByOwnerId(user.getId()).orElseThrow();
                totalProducts = productRepository.findByStoreId(store.getId()).size();
                List<Order> storeOrders = orderRepository.findByStoreId(store.getId());
                totalOrders = storeOrders.size();
                totalRevenue = storeOrders.stream()
                        .map(Order::getGrandTotal)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                totalReviews = reviewRepository.findAll().stream()
                        .filter(r -> r.getProduct().getStore().getId().equals(store.getId()))
                        .count();
                break;

            default: // INDIVIDUAL
                totalProducts = 0;
                List<Order> userOrders = orderRepository.findByUserId(user.getId());
                totalOrders = userOrders.size();
                totalRevenue = userOrders.stream()
                        .map(Order::getGrandTotal)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                totalReviews = reviewRepository.findByUserId(user.getId()).size();
                break;
        }

        return DashboardSummaryDto.builder()
                .totalProducts(totalProducts)
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .totalReviews(totalReviews)
                .build();
    }
}
