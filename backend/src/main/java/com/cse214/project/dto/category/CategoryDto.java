package com.cse214.project.dto.category;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryDto {
    private Integer id;
    private String name;
    private String parentCategoryName;
}
