package com.cse214.project.dto.order;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderDetailDto {
    private Integer id;
    private String status;
    private BigDecimal grandTotal;
    private LocalDateTime createdAt;
    private String storeName;
    private String userName;
    private List<OrderItemDto> items;
}
