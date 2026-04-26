package com.cse214.project.dto.category;

import lombok.Data;

@Data
public class CategoryUpdateRequest {
    private String name;
    private String description;
    private Integer parentId;
    private String status;
}