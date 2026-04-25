package com.cse214.project.controller;

import com.cse214.project.dto.product.ProductCreateRequest;
import com.cse214.project.dto.product.ProductDetailDto;
import com.cse214.project.dto.product.ProductListDto;
import com.cse214.project.dto.product.ProductUpdateRequest;
import com.cse214.project.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<ProductListDto>> getAllProducts(Authentication auth) {
        return ResponseEntity.ok(productService.getAllProducts(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDetailDto> getProductById(@PathVariable Integer id, Authentication auth) {
        return ResponseEntity.ok(productService.getProductById(id, auth.getName()));
    }

    @PostMapping
    public ResponseEntity<ProductDetailDto> createProduct(@Valid @RequestBody ProductCreateRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(request, auth.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDetailDto> updateProduct(@PathVariable Integer id, @Valid @RequestBody ProductUpdateRequest request, Authentication auth) {
        return ResponseEntity.ok(productService.updateProduct(id, request, auth.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Integer id, Authentication auth) {
        productService.deleteProduct(id, auth.getName());
        return ResponseEntity.noContent().build();
    }
}
