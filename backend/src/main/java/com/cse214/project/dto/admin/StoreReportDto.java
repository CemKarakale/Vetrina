package com.cse214.project.dto.admin;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StoreReportDto {
    private Integer storeId;
    private String storeName;
    private Double revenue;
    private Long orderCount;
    private Double averageOrderValue;
    private Double returnRate;
    private Integer productCount;
    private Integer reviewCount;
    private Double rating;
}