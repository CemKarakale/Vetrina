package com.cse214.project.dto.customer;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

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
}