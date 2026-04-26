package com.cse214.project.service;

import com.cse214.project.dto.product.ProductCreateRequest;
import com.cse214.project.dto.product.ProductDetailDto;
import com.cse214.project.dto.product.ProductListDto;
import com.cse214.project.dto.product.ProductUpdateRequest;
import com.cse214.project.entity.Category;
import com.cse214.project.entity.Product;
import com.cse214.project.entity.Store;
import com.cse214.project.entity.User;
import com.cse214.project.repository.CategoryRepository;
import com.cse214.project.repository.ProductRepository;
import com.cse214.project.repository.StoreRepository;
import com.cse214.project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    // ==================== READ ====================

    public List<ProductListDto> getAllProducts(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        List<Product> products;

        switch (user.getRoleType()) {
            case "ADMIN":
                products = productRepository.findAllWithCategoryAndStore();
                break;
            case "CORPORATE":
                Store store = storeRepository.findByOwnerId(user.getId()).orElseThrow();
                products = productRepository.findByStoreIdWithCategoryAndStore(store.getId());
                break;
            default: // INDIVIDUAL
                products = productRepository.findAllWithCategoryAndStore();
                break;
        }

        return products.stream().map(this::toListDto).collect(Collectors.toList());
    }

    public ProductDetailDto getProductById(Integer id, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ürün bulunamadı: " + id));

        if ("CORPORATE".equals(user.getRoleType())) {
            Store store = storeRepository.findByOwnerId(user.getId()).orElseThrow();
            if (!product.getStore().getId().equals(store.getId())) {
                throw new RuntimeException("Bu ürüne erişim yetkiniz yok.");
            }
        }

        return toDetailDto(product);
    }

    // ==================== CREATE ====================

    @Transactional
    public ProductDetailDto createProduct(ProductCreateRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();

        // Sadece CORPORATE ve ADMIN ürün ekleyebilir
        if ("INDIVIDUAL".equals(user.getRoleType())) {
            throw new RuntimeException("Bireysel kullanıcılar ürün ekleyemez.");
        }

        Store store;
        if ("CORPORATE".equals(user.getRoleType())) {
            store = storeRepository.findByOwnerId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Mağazanız bulunamadı."));
        } else {
            // ADMIN herhangi bir mağazaya ürün ekleyebilir — ilk mağazayı kullan
            store = storeRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new RuntimeException("Sistemde mağaza bulunamadı."));
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Kategori bulunamadı: " + request.getCategoryId()));

        Product product = Product.builder()
                .name(request.getName())
                .sku(request.getSku())
                .description(request.getDescription())
                .unitPrice(request.getUnitPrice())
                .stockQuantity(request.getStockQuantity())
                .store(store)
                .category(category)
                .build();

        Product saved = productRepository.save(product);
        return toDetailDto(saved);
    }

    // ==================== UPDATE ====================

    @Transactional
    public ProductDetailDto updateProduct(Integer id, ProductUpdateRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ürün bulunamadı: " + id));

        // Ownership check
        if ("CORPORATE".equals(user.getRoleType())) {
            Store store = storeRepository.findByOwnerId(user.getId()).orElseThrow();
            if (!product.getStore().getId().equals(store.getId())) {
                throw new RuntimeException("Bu ürünü güncelleme yetkiniz yok.");
            }
        } else if ("INDIVIDUAL".equals(user.getRoleType())) {
            throw new RuntimeException("Bireysel kullanıcılar ürün güncelleyemez.");
        }

        if (request.getName() != null) product.setName(request.getName());
        if (request.getSku() != null) product.setSku(request.getSku());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getUnitPrice() != null) product.setUnitPrice(request.getUnitPrice());
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Kategori bulunamadı."));
            product.setCategory(category);
        }
        if (request.getStockQuantity() != null) {
            product.setStockQuantity(request.getStockQuantity());
        }

        Product saved = productRepository.save(product);
        return toDetailDto(saved);
    }

    // ==================== DELETE ====================

    @Transactional
    public void deleteProduct(Integer id, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ürün bulunamadı: " + id));

        if ("CORPORATE".equals(user.getRoleType())) {
            Store store = storeRepository.findByOwnerId(user.getId()).orElseThrow();
            if (!product.getStore().getId().equals(store.getId())) {
                throw new RuntimeException("Bu ürünü silme yetkiniz yok.");
            }
        } else if ("INDIVIDUAL".equals(user.getRoleType())) {
            throw new RuntimeException("Bireysel kullanıcılar ürün silemez.");
        }

        productRepository.delete(product);
    }

    // ==================== STOCK UPDATE ====================

    @Transactional
    public ProductDetailDto updateStock(Integer id, Integer stockQuantity, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ürün bulunamadı: " + id));

        if ("CORPORATE".equals(user.getRoleType())) {
            Store store = storeRepository.findByOwnerId(user.getId()).orElseThrow();
            if (!product.getStore().getId().equals(store.getId())) {
                throw new RuntimeException("Bu ürünün stoğunu güncelleme yetkiniz yok.");
            }
        } else if ("INDIVIDUAL".equals(user.getRoleType())) {
            throw new RuntimeException("Bireysel kullanıcılar ürün stoğu güncelleyemez.");
        }

        if (stockQuantity == null || stockQuantity < 0) {
            throw new RuntimeException("Stok miktarı geçersiz.");
        }

        product.setStockQuantity(stockQuantity);
        Product saved = productRepository.save(product);
        return toDetailDto(saved);
    }

    // ==================== MAPPERS ====================

    private ProductListDto toListDto(Product p) {
        return ProductListDto.builder()
                .id(p.getId())
                .name(p.getName())
                .sku(p.getSku())
                .unitPrice(p.getUnitPrice())
                .categoryId(p.getCategory().getId())
                .categoryName(p.getCategory().getName())
                .storeId(p.getStore().getId())
                .storeName(p.getStore().getName())
                .stockQuantity(p.getStockQuantity())
                .build();
    }

    private ProductDetailDto toDetailDto(Product p) {
        return ProductDetailDto.builder()
                .id(p.getId())
                .sku(p.getSku())
                .name(p.getName())
                .description(p.getDescription())
                .unitPrice(p.getUnitPrice())
                .categoryId(p.getCategory().getId())
                .categoryName(p.getCategory().getName())
                .storeId(p.getStore().getId())
                .storeName(p.getStore().getName())
                .stockQuantity(p.getStockQuantity())
                .build();
    }
}
