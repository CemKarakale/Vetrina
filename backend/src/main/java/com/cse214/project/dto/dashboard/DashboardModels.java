package com.cse214.project.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class DashboardModels {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StatWidgetData {
        private String title;
        private Double value;
        private Double change;
        private String changeLabel;
        private String icon;
        private String color; // 'purple' | 'orange' | 'green' | 'pink'
        private String format; // 'number' | 'currency' | 'percent'
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ChartDataPoint {
        private String label;
        private Double value;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ChartWidgetData {
        private String title;
        private String type; // 'line' | 'bar' | 'pie'
        private List<ChartDataPoint> data;
        private String color;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SpendingCategory {
        private String category;
        private Double amount;
        private Double percentage;
        private String color;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SpendingOverview {
        private String title;
        private Double totalSpent;
        private String period;
        private List<SpendingCategory> categories;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TopProduct {
        private Integer id;
        private String name;
        private Long sales;
        private Double revenue;
        private String imageUrl;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TopProductsWidgetData {
        private String title;
        private List<TopProduct> products;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RecentOrder {
        private Integer id;
        private String productName;
        private Double amount;
        private String date;
        private String status; // 'pending' | 'completed' | 'cancelled'
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DashboardInsight {
        private String label;
        private String value;
        private String detail;
        private String status; // 'good' | 'warning' | 'danger' | 'neutral'
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DashboardAlert {
        private String title;
        private String detail;
        private String severity; // 'info' | 'warning' | 'danger'
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CustomerSegment {
        private String name;
        private Long customers;
        private Double averageSpend;
        private Double satisfaction;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StoreComparisonItem {
        private String storeName;
        private Double revenue;
        private Long orders;
        private Double rating;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AuditActivity {
        private String actor;
        private String action;
        private String date;
        private String severity; // 'info' | 'warning' | 'danger'
    }

    // Main DTOs
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserDashboardDto {
        private SpendingOverview spending;
        private ChartWidgetData spendingTrend;
        private List<RecentOrder> recentOrders;
        private List<StatWidgetData> stats;
        private List<DashboardInsight> personalInsights;
        private List<DashboardAlert> shipmentAlerts;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CorporateDashboardDto {
        private StatWidgetData revenue;
        private StatWidgetData orders;
        private StatWidgetData products;
        private StatWidgetData conversionRate;
        private ChartWidgetData revenueChart;
        private TopProductsWidgetData topProducts;
        private ChartWidgetData categoryDistribution;
        private List<DashboardAlert> inventoryAlerts;
        private List<CustomerSegment> customerSegments;
        private List<DashboardInsight> fulfillmentInsights;
        private List<DashboardInsight> reviewInsights;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AdminDashboardDto {
        private StatWidgetData totalRevenue;
        private StatWidgetData totalOrders;
        private StatWidgetData totalUsers;
        private StatWidgetData totalStores;
        private ChartWidgetData platformRevenueChart;
        private ChartWidgetData userGrowthChart;
        private ChartWidgetData categoryDistribution;
        private List<StoreComparisonItem> storeComparisons;
        private List<AuditActivity> auditActivities;
        private List<DashboardInsight> systemInsights;
    }
}
