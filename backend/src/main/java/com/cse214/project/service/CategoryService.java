package com.cse214.project.service;

import com.cse214.project.dto.category.CategoryCreateRequest;
import com.cse214.project.dto.category.CategoryDto;
import com.cse214.project.dto.category.CategoryUpdateRequest;
import com.cse214.project.entity.Category;
import com.cse214.project.repository.CategoryRepository;
import com.cse214.project.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

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
                .description(request.getDescription())
                .status("ACTIVE")
                .build();

        Category saved = categoryRepository.save(category);
        return toDto(saved);
    }

    public CategoryDto updateCategory(Integer id, CategoryUpdateRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kategori bulunamadı: " + id));

        if (request.getName() != null) category.setName(request.getName());
        if (request.getDescription() != null) category.setDescription(request.getDescription());
        if (request.getStatus() != null) category.setStatus(request.getStatus());
        if (request.getParentId() != null) {
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new RuntimeException("Üst kategori bulunamadı: " + request.getParentId()));
            category.setParentCategory(parent);
        }

        Category saved = categoryRepository.save(category);
        return toDto(saved);
    }

    public void deleteCategory(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kategori bulunamadı: " + id));
        categoryRepository.delete(category);
    }

    private CategoryDto toDto(Category c) {
        int productCount = productRepository.findAll().stream()
                .filter(p -> p.getCategory().getId().equals(c.getId()))
                .mapToInt(p -> 1)
                .sum();

        return CategoryDto.builder()
                .id(c.getId())
                .name(c.getName())
                .description(c.getDescription())
                .parentId(c.getParentCategory() != null ? c.getParentCategory().getId() : null)
                .parentCategoryName(c.getParentCategory() != null ? c.getParentCategory().getName() : null)
                .status(c.getStatus())
                .productCount(productCount)
                .build();
    }
}
