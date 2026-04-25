package com.cse214.project.dto.product;

import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductUpdateRequest {

    private String name;
    private String sku;
    private String description;

    @Positive(message = "Fiyat pozitif olmalı")
    private BigDecimal unitPrice;

    private Integer categoryId;
}
