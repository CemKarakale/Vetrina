package com.cse214.project.dto.product;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ProductDetailDto {
    private Integer id;
    private String sku;
    private String name;
    private String description;
    private BigDecimal unitPrice;
    private String categoryName;
    private String storeName;
    private Integer storeId;
}
