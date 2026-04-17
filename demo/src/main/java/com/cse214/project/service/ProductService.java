package com.cse214.project.service;

import com.cse214.project.dto.product.ProductDetailDto;
import com.cse214.project.dto.product.ProductListDto;
import com.cse214.project.entity.Product;
import com.cse214.project.entity.Store;
import com.cse214.project.entity.User;
import com.cse214.project.repository.ProductRepository;
import com.cse214.project.repository.StoreRepository;
import com.cse214.project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;

    public List<ProductListDto> getAllProducts(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        List<Product> products;

        switch (user.getRoleType()) {
            case "ADMIN":
                products = productRepository.findAll();
                break;
            case "CORPORATE":
                Store store = storeRepository.findByOwnerId(user.getId()).orElseThrow();
                products = productRepository.findByStoreId(store.getId());
                break;
            default: // INDIVIDUAL
                products = productRepository.findAll();
                break;
        }

        return products.stream().map(this::toListDto).collect(Collectors.toList());
    }

    public ProductDetailDto getProductById(Integer id, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ürün bulunamadı: " + id));

        // Corporate kullanıcı sadece kendi mağazasının ürünlerini görebilir
        if ("CORPORATE".equals(user.getRoleType())) {
            Store store = storeRepository.findByOwnerId(user.getId()).orElseThrow();
            if (!product.getStore().getId().equals(store.getId())) {
                throw new RuntimeException("Bu ürüne erişim yetkiniz yok.");
            }
        }

        return toDetailDto(product);
    }

    private ProductListDto toListDto(Product p) {
        return ProductListDto.builder()
                .id(p.getId())
                .name(p.getName())
                .unitPrice(p.getUnitPrice())
                .categoryName(p.getCategory().getName())
                .storeName(p.getStore().getName())
                .build();
    }

    private ProductDetailDto toDetailDto(Product p) {
        return ProductDetailDto.builder()
                .id(p.getId())
                .sku(p.getSku())
                .name(p.getName())
                .description(p.getDescription())
                .unitPrice(p.getUnitPrice())
                .categoryName(p.getCategory().getName())
                .storeName(p.getStore().getName())
                .storeId(p.getStore().getId())
                .build();
    }
}
