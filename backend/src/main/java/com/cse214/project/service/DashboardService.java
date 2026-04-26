package com.cse214.project.service;

import com.cse214.project.dto.dashboard.DashboardModels.*;
import com.cse214.project.entity.Order;
import com.cse214.project.entity.Store;
import com.cse214.project.entity.User;
import com.cse214.project.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;

    public UserDashboardDto getUserDashboard(String userEmail, String range) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        List<Order> orders = orderRepository.findByUserId(user.getId());
        
        double totalSpent = orders.stream()
                .map(Order::getGrandTotal)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();
                
        List<SpendingCategory> categories = List.of(
            SpendingCategory.builder().category("Electronics").amount(totalSpent * 0.4).percentage(40.0).color("purple").build(),
            SpendingCategory.builder().category("Clothing").amount(totalSpent * 0.3).percentage(30.0).color("pink").build(),
            SpendingCategory.builder().category("Books").amount(totalSpent * 0.3).percentage(30.0).color("orange").build()
        );

        SpendingOverview spending = SpendingOverview.builder()
                .title("Total Spending")
                .totalSpent(totalSpent)
                .period(range)
                .categories(categories)
                .build();

        ChartWidgetData spendingTrend = ChartWidgetData.builder()
                .title("Spending Trend")
                .type("line")
                .color("purple")
                .data(List.of(
                        new ChartDataPoint("Jan", 120.0),
                        new ChartDataPoint("Feb", 150.0),
                        new ChartDataPoint("Mar", 90.0),
                        new ChartDataPoint("Apr", totalSpent > 0 ? totalSpent : 200.0)
                )).build();

        List<RecentOrder> recentOrders = new ArrayList<>();
        int count = 0;
        for (Order o : orders) {
            if (count++ >= 5) break;
            recentOrders.add(RecentOrder.builder()
                    .id(o.getId())
                    .productName("Order #" + o.getId())
                    .amount(o.getGrandTotal().doubleValue())
                    .date(o.getCreatedAt() != null ? o.getCreatedAt().toString() : "Recent")
                    .status(o.getStatus().toLowerCase())
                    .build());
        }

        List<StatWidgetData> stats = List.of(
                StatWidgetData.builder().title("Total Orders").value((double) orders.size()).icon("shopping-bag").color("purple").format("number").build(),
                StatWidgetData.builder().title("Reviews Written").value(12.0).icon("star").color("orange").format("number").build()
        );

        return UserDashboardDto.builder()
                .spending(spending)
                .spendingTrend(spendingTrend)
                .recentOrders(recentOrders)
                .stats(stats)
                .build();
    }

    public CorporateDashboardDto getCorporateDashboard(String userEmail, String range) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Store store = storeRepository.findByOwnerId(user.getId()).orElse(null);
        
        long totalProducts = store != null ? productRepository.findByStoreId(store.getId()).size() : 0;
        List<Order> storeOrders = store != null ? orderRepository.findByStoreId(store.getId()) : new ArrayList<>();
        double totalRevenue = storeOrders.stream().map(Order::getGrandTotal).mapToDouble(BigDecimal::doubleValue).sum();

        StatWidgetData revStat = StatWidgetData.builder().title("Revenue").value(totalRevenue).change(12.5).changeLabel("vs last month").icon("dollar-sign").color("green").format("currency").build();
        StatWidgetData ordStat = StatWidgetData.builder().title("Orders").value((double) storeOrders.size()).change(-2.4).changeLabel("vs last month").icon("shopping-cart").color("purple").format("number").build();
        StatWidgetData prodStat = StatWidgetData.builder().title("Products").value((double) totalProducts).change(0.0).changeLabel("No change").icon("package").color("orange").format("number").build();
        StatWidgetData convStat = StatWidgetData.builder().title("Conversion Rate").value(3.2).change(0.5).changeLabel("vs last month").icon("activity").color("pink").format("percent").build();

        ChartWidgetData revChart = ChartWidgetData.builder()
                .title("Revenue Over Time")
                .type("line")
                .color("green")
                .data(List.of(new ChartDataPoint("Week 1", 5000.0), new ChartDataPoint("Week 2", 7000.0), new ChartDataPoint("Week 3", 6500.0), new ChartDataPoint("Week 4", totalRevenue > 0 ? totalRevenue : 8000.0)))
                .build();

        ChartWidgetData catDist = ChartWidgetData.builder()
                .title("Category Distribution")
                .type("pie")
                .data(List.of(new ChartDataPoint("Electronics", 45.0), new ChartDataPoint("Accessories", 30.0), new ChartDataPoint("Software", 25.0)))
                .build();

        TopProductsWidgetData topProds = TopProductsWidgetData.builder()
                .title("Top Products")
                .products(List.of(
                        TopProduct.builder().id(1).name("Premium Widget").sales(150L).revenue(4500.0).build(),
                        TopProduct.builder().id(2).name("Basic Widget").sales(300L).revenue(3000.0).build()
                )).build();

        return CorporateDashboardDto.builder()
                .revenue(revStat)
                .orders(ordStat)
                .products(prodStat)
                .conversionRate(convStat)
                .revenueChart(revChart)
                .topProducts(topProds)
                .categoryDistribution(catDist)
                .inventoryAlerts(List.of(DashboardAlert.builder().title("Low Stock").detail("Premium Widget is below 10 units").severity("warning").build()))
                .build();
    }

    public AdminDashboardDto getAdminDashboard(String userEmail, String range) {
        long totalUsers = userRepository.count();
        long totalStores = storeRepository.count();
        long totalOrders = orderRepository.count();
        double totalRevenue = orderRepository.findAll().stream().map(Order::getGrandTotal).mapToDouble(BigDecimal::doubleValue).sum();

        StatWidgetData revStat = StatWidgetData.builder().title("Platform Revenue").value(totalRevenue).change(8.5).changeLabel("vs last month").icon("dollar-sign").color("green").format("currency").build();
        StatWidgetData ordStat = StatWidgetData.builder().title("Total Orders").value((double) totalOrders).change(5.2).changeLabel("vs last month").icon("shopping-cart").color("purple").format("number").build();
        StatWidgetData usrStat = StatWidgetData.builder().title("Total Users").value((double) totalUsers).change(12.0).changeLabel("vs last month").icon("users").color("orange").format("number").build();
        StatWidgetData strStat = StatWidgetData.builder().title("Active Stores").value((double) totalStores).change(2.0).changeLabel("vs last month").icon("store").color("pink").format("number").build();

        ChartWidgetData platChart = ChartWidgetData.builder()
                .title("Platform Revenue")
                .type("bar")
                .color("green")
                .data(List.of(new ChartDataPoint("Q1", 150000.0), new ChartDataPoint("Q2", 180000.0), new ChartDataPoint("Q3", 175000.0), new ChartDataPoint("Q4", totalRevenue > 0 ? totalRevenue : 210000.0)))
                .build();

        ChartWidgetData userChart = ChartWidgetData.builder()
                .title("User Growth")
                .type("line")
                .color("orange")
                .data(List.of(new ChartDataPoint("Jan", 1000.0), new ChartDataPoint("Feb", 1200.0), new ChartDataPoint("Mar", 1500.0), new ChartDataPoint("Apr", (double) totalUsers)))
                .build();

        ChartWidgetData catDist = ChartWidgetData.builder()
                .title("Category Sales")
                .type("pie")
                .data(List.of(new ChartDataPoint("Electronics", 40.0), new ChartDataPoint("Fashion", 35.0), new ChartDataPoint("Home", 25.0)))
                .build();

        List<AuditActivity> audits = List.of(
                AuditActivity.builder().actor("System").action("Daily Backup Completed").date("Today 02:00 AM").severity("info").build(),
                AuditActivity.builder().actor("Admin (ID: 1)").action("Suspended Store #42").date("Yesterday 14:30 PM").severity("warning").build()
        );

        List<StoreComparisonItem> comparisons = List.of(
                StoreComparisonItem.builder().storeName("Tech Hub").revenue(45000.0).orders(1200L).rating(4.8).build(),
                StoreComparisonItem.builder().storeName("Fashion Plus").revenue(38000.0).orders(950L).rating(4.5).build()
        );

        return AdminDashboardDto.builder()
                .totalRevenue(revStat)
                .totalOrders(ordStat)
                .totalUsers(usrStat)
                .totalStores(strStat)
                .platformRevenueChart(platChart)
                .userGrowthChart(userChart)
                .categoryDistribution(catDist)
                .auditActivities(audits)
                .storeComparisons(comparisons)
                .build();
    }
}
