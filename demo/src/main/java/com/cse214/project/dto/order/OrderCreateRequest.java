package com.cse214.project.dto.order;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.List;

@Data
public class OrderCreateRequest {

    @NotNull(message = "Mağaza ID boş olamaz")
    private Integer storeId;

    @NotNull(message = "Sipariş kalemleri boş olamaz")
    private List<OrderItemCreateRequest> items;

    @Data
    public static class OrderItemCreateRequest {
        @NotNull(message = "Ürün ID boş olamaz")
        private Integer productId;

        @NotNull(message = "Miktar boş olamaz")
        @Positive(message = "Miktar pozitif olmalı")
        private Integer quantity;
    }
}
