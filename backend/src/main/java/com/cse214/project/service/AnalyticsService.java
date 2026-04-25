package com.cse214.project.service;

import com.cse214.project.dto.analytics.AnalyticsOverviewDto;
import com.cse214.project.dto.analytics.AnalyticsOverviewDto.CategoryDistribution;
import com.cse214.project.dto.analytics.AnalyticsOverviewDto.RevenueTrend;
import com.cse214.project.entity.Order;
import com.cse214.project.entity.OrderItem;
import com.cse214.project.entity.Review;
import com.cse214.project.entity.User;
import com.cse214.project.repository.OrderItemRepository;
import com.cse214.project.repository.OrderRepository;
import com.cse214.project.repository.ReviewRepository;
import com.cse214.project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);

    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;

    public AnalyticsOverviewDto getOverview() {
        log.info("Fetching analytics overview from database");
        List<Order> allOrders = orderRepository.findAll();
        List<Review> allReviews = reviewRepository.findAll();
        List<OrderItem> allOrderItems = orderItemRepository.findAll();

        log.info("Found {} orders, {} reviews, {} order items", allOrders.size(), allReviews.size(), allOrderItems.size());

        long totalOrders = allOrders.size();
        BigDecimal totalRevenue = allOrders.stream()
                .map(Order::getGrandTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long totalReviews = allReviews.size();

        long completedOrders = allOrders.stream()
                .filter(o -> "COMPLETED".equals(o.getStatus()))
                .count();

        double returnRate = totalOrders > 0 ? ((double) (totalOrders - completedOrders) / totalOrders) * 100 : 0;

        BigDecimal avgOrderValue = totalOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, BigDecimal.ROUND_HALF_UP)
                : BigDecimal.ZERO;

        long totalCustomers = userRepository.findAll().stream()
                .filter(u -> "INDIVIDUAL".equals(u.getRoleType()))
                .count();

        List<CategoryDistribution> categoryDistribution = calculateCategoryDistribution(allOrderItems);
        List<RevenueTrend> revenueTrend = calculateRevenueTrend(allOrders);

        return AnalyticsOverviewDto.builder()
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .totalReviews(totalReviews)
                .totalCustomers(totalCustomers)
                .returnRate(Math.round(returnRate * 100.0) / 100.0)
                .averageOrderValue(avgOrderValue)
                .completedOrders(completedOrders)
                .pendingOrders(totalOrders - completedOrders)
                .categoryDistribution(categoryDistribution)
                .revenueTrend(revenueTrend)
                .build();
    }

    private List<CategoryDistribution> calculateCategoryDistribution(List<OrderItem> orderItems) {
        Map<String, BigDecimal> categoryRevenue = new HashMap<>();

        for (OrderItem item : orderItems) {
            String categoryName = item.getProduct().getCategory().getName();
            BigDecimal itemTotal = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            categoryRevenue.merge(categoryName, itemTotal, BigDecimal::add);
        }

        BigDecimal totalCategoryRevenue = categoryRevenue.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalCategoryRevenue.compareTo(BigDecimal.ZERO) == 0) {
            return List.of();
        }

        final BigDecimal finalTotal = totalCategoryRevenue;
        return categoryRevenue.entrySet().stream()
                .map(entry -> CategoryDistribution.builder()
                        .label(entry.getKey())
                        .percentage(entry.getValue().divide(finalTotal, 4, BigDecimal.ROUND_HALF_UP)
                                .multiply(BigDecimal.valueOf(100)).doubleValue())
                        .build())
                .collect(Collectors.toList());
    }

    private List<RevenueTrend> calculateRevenueTrend(List<Order> orders) {
        Map<String, BigDecimal> monthlyRevenue = new HashMap<>();

        for (Order order : orders) {
            LocalDateTime createdAt = order.getCreatedAt();
            if (createdAt == null) continue;

            String monthKey = createdAt.getMonth().name().substring(0, 3);
            monthlyRevenue.merge(monthKey, order.getGrandTotal(), BigDecimal::add);
        }

        return monthlyRevenue.entrySet().stream()
                .map(entry -> RevenueTrend.builder()
                        .month(entry.getKey())
                        .revenue(entry.getValue())
                        .build())
                .collect(Collectors.toList());
    }
}