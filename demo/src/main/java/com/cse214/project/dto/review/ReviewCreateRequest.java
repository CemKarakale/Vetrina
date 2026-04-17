package com.cse214.project.dto.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

@Data
public class ReviewCreateRequest {

    @NotNull(message = "Ürün ID boş olamaz")
    private Integer productId;

    @NotNull(message = "Yıldız puanı boş olamaz")
    @Min(value = 1, message = "Yıldız en az 1 olmalı")
    @Max(value = 5, message = "Yıldız en fazla 5 olmalı")
    private Integer starRating;

    private String content;
}
