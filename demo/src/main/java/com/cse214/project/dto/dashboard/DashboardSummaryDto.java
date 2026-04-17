package com.cse214.project.dto.dashboard;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class DashboardSummaryDto {
    private long totalProducts;
    private long totalOrders;
    private BigDecimal totalRevenue;
    private long totalReviews;
}
