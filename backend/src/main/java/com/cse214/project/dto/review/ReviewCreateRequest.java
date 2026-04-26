package com.cse214.project.dto.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class ReviewCreateRequest {

    private Integer productId;

    private String productName;

    @Min(value = 1, message = "Yıldız en az 1 olmalı")
    @Max(value = 5, message = "Yıldız en fazla 5 olmalı")
    private Integer starRating;

    private String content;
}
