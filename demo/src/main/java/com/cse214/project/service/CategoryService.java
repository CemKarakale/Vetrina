package com.cse214.project.service;

import com.cse214.project.dto.category.CategoryCreateRequest;
import com.cse214.project.dto.category.CategoryDto;
import com.cse214.project.entity.Category;
import com.cse214.project.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public CategoryDto getCategoryById(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kategori bulunamadı: " + id));
        return toDto(category);
    }

    public CategoryDto createCategory(CategoryCreateRequest request) {
        Category parent = null;
        if (request.getParentId() != null) {
            parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("Üst kategori bulunamadı: " + request.getParentId()));
        }

        Category category = Category.builder()
                .name(request.getName())
                .parentCategory(parent)
                .build();

        Category saved = categoryRepository.save(category);
        return toDto(saved);
    }

    public void deleteCategory(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kategori bulunamadı: " + id));
        categoryRepository.delete(category);
    }

    private CategoryDto toDto(Category c) {
        return CategoryDto.builder()
                .id(c.getId())
                .name(c.getName())
                .parentCategoryName(c.getParentCategory() != null ? c.getParentCategory().getName() : null)
                .build();
    }
}
