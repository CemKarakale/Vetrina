package com.cse214.project.dto.review;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReviewDto {
    private Integer id;
    private Integer productId;
    private String productName;
    private String userName;
    private Integer starRating;
    private String content;
}
