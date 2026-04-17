package com.cse214.project.dto.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductCreateRequest {

    @NotBlank(message = "Ürün adı boş olamaz")
    private String name;

    @NotBlank(message = "SKU boş olamaz")
    private String sku;

    private String description;

    @NotNull(message = "Fiyat boş olamaz")
    @Positive(message = "Fiyat pozitif olmalı")
    private BigDecimal unitPrice;

    @NotNull(message = "Kategori ID boş olamaz")
    private Integer categoryId;
}
