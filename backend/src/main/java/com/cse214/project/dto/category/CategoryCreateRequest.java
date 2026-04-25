package com.cse214.project.dto.category;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategoryCreateRequest {

    @NotBlank(message = "Kategori adı boş olamaz")
    private String name;

    private Integer parentId;

    private String description;
}
