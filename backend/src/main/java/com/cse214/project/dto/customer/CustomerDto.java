package com.cse214.project.dto.customer;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class CustomerDto {
    private Integer id;
    private Integer userId;
    private String name;
    private String email;
    private Integer age;
    private String city;
    private String membershipType;
    private BigDecimal totalSpend;
    private Long orderCount;
    private String status;
    private LocalDateTime lastOrderDate;
    private Long returnCount;
    private Long reviewCount;
    private BigDecimal averageOrderValue;
}