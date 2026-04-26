package com.cse214.project.dto.admin;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StoreDto {
    private Integer id;
    private String name;
    private String status;
    private String ownerName;
    private String ownerEmail;
    private Integer productCount;
    private Long orderCount;
}
