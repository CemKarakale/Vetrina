package com.cse214.project.dto.product;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ProductListDto {
    private Integer id;
    private String name;
    private BigDecimal unitPrice;
    private String categoryName;
    private String storeName;
}
