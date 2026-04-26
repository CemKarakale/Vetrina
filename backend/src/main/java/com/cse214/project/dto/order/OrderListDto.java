package com.cse214.project.dto.order;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class OrderListDto {
    private Integer id;
    private String status;
    private BigDecimal grandTotal;
    private LocalDateTime createdAt;
    private String storeName;
}
