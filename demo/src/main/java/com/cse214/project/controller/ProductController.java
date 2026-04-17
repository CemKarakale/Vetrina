package com.cse214.project.controller;

import com.cse214.project.dto.product.ProductDetailDto;
import com.cse214.project.dto.product.ProductListDto;
import com.cse214.project.service.ProductService;
import lombok.RequiredArgsConstructor;
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
}
