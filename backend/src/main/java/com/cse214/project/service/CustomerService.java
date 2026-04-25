package com.cse214.project.service;

import com.cse214.project.dto.customer.CustomerDto;
import com.cse214.project.entity.CustomerProfile;
import com.cse214.project.entity.Order;
import com.cse214.project.entity.Review;
import com.cse214.project.entity.User;
import com.cse214.project.repository.CustomerProfileRepository;
import com.cse214.project.repository.OrderRepository;
import com.cse214.project.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private static final Logger log = LoggerFactory.getLogger(CustomerService.class);

    private final CustomerProfileRepository customerProfileRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;

    public List<CustomerDto> getAllCustomers() {
        log.info("Fetching all customers from database");
        List<CustomerProfile> profiles = customerProfileRepository.findAll();
        log.info("Found {} customer profiles", profiles.size());

        return profiles.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getCustomerSegments() {
        List<CustomerProfile> profiles = customerProfileRepository.findAll();

        List<Map<String, Object>> segments = new ArrayList<>();

        // Segment 1: VIP (totalSpend > 10000)
        Map<String, Object> vip = createSegment("VIP", profiles, cp -> {
            List<Order> orders = orderRepository.findByUserId(cp.getUser().getId());
            BigDecimal total = orders.stream().map(Order::getGrandTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
            return total.doubleValue() > 10000;
        });
        segments.add(vip);

        // Segment 2: Active (order in last 3 months)
        Map<String, Object> active = createSegment("Active", profiles, cp -> {
            List<Order> orders = orderRepository.findByUserId(cp.getUser().getId());
            return orders.stream().anyMatch(o -> o.getCreatedAt() != null &&
                    o.getCreatedAt().isAfter(LocalDateTime.now().minusMonths(3)));
        });
        segments.add(active);

        // Segment 3: At Risk (no order in 6+ months)
        Map<String, Object> atRisk = createSegment("At Risk", profiles, cp -> {
            List<Order> orders = orderRepository.findByUserId(cp.getUser().getId());
            boolean hasOldOrder = orders.stream().anyMatch(o -> o.getCreatedAt() != null &&
                    o.getCreatedAt().isBefore(LocalDateTime.now().minusMonths(6)));
            boolean noRecentOrder = orders.stream().noneMatch(o -> o.getCreatedAt() != null &&
                    o.getCreatedAt().isAfter(LocalDateTime.now().minusMonths(6)));
            return hasOldOrder && noRecentOrder;
        });
        segments.add(atRisk);

        // Segment 4: New (created last 30 days)
        Map<String, Object> newCust = createSegment("New", profiles, cp -> {
            return cp.getUser().getCreatedAt() != null &&
                    cp.getUser().getCreatedAt().isAfter(LocalDateTime.now().minusDays(30));
        });
        segments.add(newCust);

        return segments;
    }

    private Map<String, Object> createSegment(String name, List<CustomerProfile> profiles,
                                               java.util.function.Predicate<CustomerProfile> predicate) {
        List<CustomerProfile> segment = profiles.stream()
                .filter(predicate)
                .collect(Collectors.toList());

        double avgSpend = segment.stream()
                .mapToDouble(cp -> {
                    List<Order> orders = orderRepository.findByUserId(cp.getUser().getId());
                    return orders.stream().map(Order::getGrandTotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add).doubleValue();
                })
                .average()
                .orElse(0.0);

        double avgOrders = segment.stream()
                .mapToDouble(cp -> orderRepository.findByUserId(cp.getUser().getId()).size())
                .average()
                .orElse(0.0);

        double avgSatisfaction = segment.stream()
                .mapToDouble(cp -> {
                    List<Review> reviews = reviewRepository.findAll().stream()
                            .filter(r -> r.getUser().getId().equals(cp.getUser().getId()))
                            .collect(Collectors.toList());
                    return reviews.stream().mapToInt(Review::getStarRating).average().orElse(0.0);
                })
                .average()
                .orElse(0.0);

        Map<String, Object> result = new HashMap<>();
        result.put("name", name);
        result.put("customers", segment.size());
        result.put("averageSpend", Math.round(avgSpend * 100.0) / 100.0);
        result.put("orderCount", Math.round(avgOrders * 10.0) / 10.0);
        result.put("satisfaction", Math.round(avgSatisfaction * 10.0) / 10.0);
        result.put("retentionRate", calculateRetentionRate(segment));

        return result;
    }

    private double calculateRetentionRate(List<CustomerProfile> segment) {
        if (segment.isEmpty()) return 0;
        long retained = segment.stream()
                .filter(cp -> {
                    List<Order> orders = orderRepository.findByUserId(cp.getUser().getId());
                    return orders.size() > 1;
                })
                .count();
        return Math.round(((double) retained / segment.size()) * 100.0 * 10.0) / 10.0;
    }

    private CustomerDto toDto(CustomerProfile cp) {
        User user = cp.getUser();
        log.debug("Processing customer profile {} for user {}", cp.getId(), user != null ? user.getId() : "null");

        List<Order> customerOrders = orderRepository.findByUserId(user.getId());

        BigDecimal totalSpend = customerOrders.stream()
                .map(Order::getGrandTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long orderCount = customerOrders.size();

        boolean hasRecentOrder = customerOrders.stream()
                .anyMatch(o -> o.getCreatedAt() != null &&
                        o.getCreatedAt().isAfter(java.time.LocalDateTime.now().minusMonths(3)));

        long returnCount = customerOrders.stream()
                .filter(o -> "CANCELLED".equals(o.getStatus()) || "RETURNED".equals(o.getStatus()))
                .count();

        long reviewCount = reviewRepository.findAll().stream()
                .filter(r -> r.getUser().getId().equals(user.getId()))
                .count();

        LocalDateTime lastOrder = customerOrders.stream()
                .map(Order::getCreatedAt)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        BigDecimal avgOrderValue = orderCount > 0
                ? totalSpend.divide(BigDecimal.valueOf(orderCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return CustomerDto.builder()
                .id(cp.getId())
                .userId(user != null ? user.getId() : null)
                .name(user != null ? user.getName() : "Unknown")
                .email(user != null ? user.getEmail() : "Unknown")
                .age(cp.getAge())
                .city(cp.getCity())
                .membershipType(cp.getMembershipType())
                .totalSpend(totalSpend)
                .orderCount(orderCount)
                .averageOrderValue(avgOrderValue)
                .status(hasRecentOrder ? "Active" : "Inactive")
                .lastOrderDate(lastOrder)
                .returnCount(returnCount)
                .reviewCount(reviewCount)
                .build();
    }
}