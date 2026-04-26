package com.cse214.project.dto.order;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class OrderItemDto {
    private Integer id;
    private String productName;
    private Integer quantity;
    private BigDecimal price;
}
