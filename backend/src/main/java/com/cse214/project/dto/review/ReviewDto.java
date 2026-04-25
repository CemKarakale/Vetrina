package com.cse214.project.dto.review;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ReviewDto {
    private Integer id;
    private Integer productId;
    private String productName;
    private Integer userId;
    private String userName;
    private Integer starRating;
    private String content;
    private String adminReply;
    private LocalDateTime replyCreatedAt;
}
