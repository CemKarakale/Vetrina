package com.cse214.project.service;

import com.cse214.project.dto.admin.StoreReportDto;
import com.cse214.project.entity.Order;
import com.cse214.project.entity.Review;
import com.cse214.project.entity.Store;
import com.cse214.project.repository.OrderRepository;
import com.cse214.project.repository.ProductRepository;
import com.cse214.project.repository.ReviewRepository;
import com.cse214.project.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final StoreRepository storeRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;

    public List<StoreReportDto> getStoreReports(LocalDate from, LocalDate to, String sortBy) {
        List<Store> stores = storeRepository.findAll();
        List<StoreReportDto> reports = new ArrayList<>();

        for (Store store : stores) {
            List<Order> storeOrders = orderRepository.findByStoreId(store.getId());

            // Filter by date range
            if (from != null || to != null) {
                storeOrders = storeOrders.stream()
                        .filter(o -> {
                            if (o.getCreatedAt() == null) return false;
                            if (from != null && o.getCreatedAt().toLocalDate().isBefore(from)) return false;
                            if (to != null && o.getCreatedAt().toLocalDate().isAfter(to)) return false;
                            return true;
                        })
                        .collect(Collectors.toList());
            }

            double revenue = storeOrders.stream()
                    .map(Order::getGrandTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .doubleValue();

            long orderCount = storeOrders.size();
            double avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;

            long completedOrders = storeOrders.stream()
                    .filter(o -> "DELIVERED".equals(o.getStatus()))
                    .count();
            double returnRate = orderCount > 0 ? ((double) (orderCount - completedOrders) / orderCount) * 100 : 0;

            int productCount = productRepository.findByStoreId(store.getId()).size();

            List<Review> storeReviews = reviewRepository.findAll().stream()
                    .filter(r -> r.getProduct().getStore().getId().equals(store.getId()))
                    .collect(Collectors.toList());

            double avgRating = storeReviews.stream()
                    .mapToInt(Review::getStarRating)
                    .average()
                    .orElse(0.0);

            reports.add(StoreReportDto.builder()
                    .storeId(store.getId())
                    .storeName(store.getName())
                    .revenue(revenue)
                    .orderCount(orderCount)
                    .averageOrderValue(BigDecimal.valueOf(avgOrderValue).setScale(2, RoundingMode.HALF_UP).doubleValue())
                    .returnRate(Math.round(returnRate * 100.0) / 100.0)
                    .productCount(productCount)
                    .reviewCount(storeReviews.size())
                    .rating(Math.round(avgRating * 10.0) / 10.0)
                    .build());
        }

        // Sort
        if ("revenue".equals(sortBy)) {
            reports.sort((a, b) -> Double.compare(b.getRevenue(), a.getRevenue()));
        } else if ("orders".equals(sortBy)) {
            reports.sort((a, b) -> Long.compare(b.getOrderCount(), a.getOrderCount()));
        } else if ("rating".equals(sortBy)) {
            reports.sort((a, b) -> Double.compare(b.getRating(), a.getRating()));
        }

        return reports;
    }
}