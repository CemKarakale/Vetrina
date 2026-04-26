package com.cse214.project.dto.product;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ProductListDto {
    private Integer id;
    private String name;
    private String sku;
    private BigDecimal unitPrice;
    private Integer categoryId;
    private String categoryName;
    private Integer storeId;
    private String storeName;
    private Integer stockQuantity;
}
