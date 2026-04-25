package com.cse214.project.service;

import com.cse214.project.dto.customer.CustomerDto;
import com.cse214.project.entity.CustomerProfile;
import com.cse214.project.entity.Order;
import com.cse214.project.entity.User;
import com.cse214.project.repository.CustomerProfileRepository;
import com.cse214.project.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private static final Logger log = LoggerFactory.getLogger(CustomerService.class);

    private final CustomerProfileRepository customerProfileRepository;
    private final OrderRepository orderRepository;

    public List<CustomerDto> getAllCustomers() {
        log.info("Fetching all customers from database");
        List<CustomerProfile> profiles = customerProfileRepository.findAll();
        log.info("Found {} customer profiles", profiles.size());

        return profiles.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
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
                .status(hasRecentOrder ? "Active" : "Inactive")
                .build();
    }
}