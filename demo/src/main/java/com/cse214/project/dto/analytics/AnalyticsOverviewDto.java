package com.cse214.project.dto.analytics;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class AnalyticsOverviewDto {
    private Long totalOrders;
    private BigDecimal totalRevenue;
    private Long totalReviews;
    private Long totalCustomers;
    private Double returnRate;
    private BigDecimal averageOrderValue;
    private Long completedOrders;
    private Long pendingOrders;
    private List<CategoryDistribution> categoryDistribution;
    private List<RevenueTrend> revenueTrend;

    @Data
    @Builder
    public static class CategoryDistribution {
        private String label;
        private Double percentage;
    }

    @Data
    @Builder
    public static class RevenueTrend {
        private String month;
        private BigDecimal revenue;
    }
}