package com.cse214.project.service;

import com.cse214.project.dto.order.OrderCreateRequest;
import com.cse214.project.dto.order.OrderDetailDto;
import com.cse214.project.dto.order.OrderItemDto;
import com.cse214.project.dto.order.OrderListDto;
import com.cse214.project.entity.*;
import com.cse214.project.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    // ==================== READ ====================

    public List<OrderListDto> getAllOrders(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        List<Order> orders;

        switch (user.getRoleType()) {
            case "ADMIN":
                orders = orderRepository.findAllWithUserAndStore();
                break;
            case "CORPORATE":
                Store store = storeRepository.findByOwnerId(user.getId()).orElseThrow();
                orders = orderRepository.findByStoreIdWithUserAndStore(store.getId());
                break;
            default: // INDIVIDUAL
                orders = orderRepository.findByUserIdWithUserAndStore(user.getId());
                break;
        }

        return orders.stream().map(this::toListDto).collect(Collectors.toList());
    }

    public OrderDetailDto getOrderById(Integer id, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Order order = orderRepository.findByIdWithUserAndStore(id)
                .orElseThrow(() -> new RuntimeException("Sipariş bulunamadı: " + id));

        switch (user.getRoleType()) {
            case "CORPORATE":
                Store store = storeRepository.findByOwnerId(user.getId()).orElseThrow();
                if (!order.getStore().getId().equals(store.getId())) {
                    throw new com.cse214.project.exception.ForbiddenAccessException("Bu siparişe erişim yetkiniz yok.");
                }
                break;
            case "INDIVIDUAL":
                if (!order.getUser().getId().equals(user.getId())) {
                    throw new com.cse214.project.exception.ForbiddenAccessException("Bu siparişe erişim yetkiniz yok.");
                }
                break;
        }

        List<OrderItem> items = orderItemRepository.findByOrderIdWithProduct(order.getId());
        List<OrderItemDto> itemDtos = items.stream().map(this::toItemDto).collect(Collectors.toList());

        return OrderDetailDto.builder()
                .id(order.getId())
                .status(order.getStatus())
                .grandTotal(order.getGrandTotal())
                .createdAt(order.getCreatedAt())
                .storeName(order.getStore().getName())
                .userName(order.getUser().getName())
                .items(itemDtos)
                .build();
    }

    // ==================== CREATE ====================

    @Transactional
    public OrderDetailDto createOrder(OrderCreateRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();

        Store store = storeRepository.findById(request.getStoreId())
                .orElseThrow(() -> new RuntimeException("Mağaza bulunamadı: " + request.getStoreId()));

        // Sipariş oluştur
        Order order = Order.builder()
                .user(user)
                .store(store)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .grandTotal(BigDecimal.ZERO) // Aşağıda hesaplanacak
                .build();

        Order savedOrder = orderRepository.save(order);

        // Sipariş kalemlerini oluştur ve toplam hesapla
        BigDecimal grandTotal = BigDecimal.ZERO;
        List<OrderItemDto> itemDtos = new ArrayList<>();

        for (OrderCreateRequest.OrderItemCreateRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Ürün bulunamadı: " + itemReq.getProductId()));

            // Stok güncelle
            int newStock = product.getStockQuantity() - itemReq.getQuantity();
            if (newStock < 0) {
                throw new RuntimeException("Yetersiz stok: " + product.getName() + " (Mevcut: " + product.getStockQuantity() + ", İstenen: " + itemReq.getQuantity() + ")");
            }
            product.setStockQuantity(newStock);
            productRepository.save(product);

            BigDecimal lineTotal = product.getUnitPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));

            OrderItem orderItem = OrderItem.builder()
                    .order(savedOrder)
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .price(lineTotal)
                    .build();

            orderItemRepository.save(orderItem);
            grandTotal = grandTotal.add(lineTotal);

            itemDtos.add(OrderItemDto.builder()
                    .id(orderItem.getId())
                    .productName(product.getName())
                    .quantity(itemReq.getQuantity())
                    .price(lineTotal)
                    .build());
        }

        // Grand total güncelle
        savedOrder.setGrandTotal(grandTotal);
        orderRepository.save(savedOrder);

        return OrderDetailDto.builder()
                .id(savedOrder.getId())
                .status(savedOrder.getStatus())
                .grandTotal(grandTotal)
                .createdAt(savedOrder.getCreatedAt())
                .storeName(store.getName())
                .userName(user.getName())
                .items(itemDtos)
                .build();
    }

    // ==================== UPDATE STATUS ====================

    @Transactional
    public OrderListDto updateOrderStatus(Integer id, String newStatus, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sipariş bulunamadı: " + id));

        // Sadece CORPORATE (kendi mağazası) ve ADMIN durumu güncelleyebilir
        if ("CORPORATE".equals(user.getRoleType())) {
            Store store = storeRepository.findByOwnerId(user.getId()).orElseThrow();
            if (!order.getStore().getId().equals(store.getId())) {
                throw new com.cse214.project.exception.ForbiddenAccessException("Bu siparişin durumunu güncelleme yetkiniz yok.");
            }
        } else if ("INDIVIDUAL".equals(user.getRoleType())) {
            throw new RuntimeException("Bireysel kullanıcılar sipariş durumu güncelleyemez.");
        }

        // Status transition validation
        String currentStatus = order.getStatus();
        validateStatusTransition(currentStatus, newStatus);

        order.setStatus(newStatus);
        Order saved = orderRepository.save(order);
        return toListDto(saved);
    }

    private void validateStatusTransition(String current, String next) {
        // Valid transitions map
        java.util.Map<String, java.util.Set<String>> validTransitions = new java.util.HashMap<>();
        validTransitions.put("PENDING", java.util.Set.of("CONFIRMED", "CANCELLED"));
        validTransitions.put("CONFIRMED", java.util.Set.of("PROCESSING", "CANCELLED"));
        validTransitions.put("PROCESSING", java.util.Set.of("SHIPPED", "CANCELLED"));
        validTransitions.put("SHIPPED", java.util.Set.of("DELIVERED"));
        validTransitions.put("DELIVERED", java.util.Set.of());
        validTransitions.put("CANCELLED", java.util.Set.of());

        java.util.Set<String> allowed = validTransitions.getOrDefault(current, java.util.Set.of());
        if (!allowed.contains(next)) {
            throw new RuntimeException(
                    "Geçersiz durum geçişi: " + current + " -> " + next +
                    ". İzin verilen geçişler: " + (allowed.isEmpty() ? "yok" : String.join(", ", allowed))
            );
        }
    }

    // ==================== MAPPERS ====================

    private OrderListDto toListDto(Order o) {
        return OrderListDto.builder()
                .id(o.getId())
                .status(o.getStatus())
                .grandTotal(o.getGrandTotal())
                .createdAt(o.getCreatedAt())
                .storeName(o.getStore().getName())
                .build();
    }

    private OrderItemDto toItemDto(OrderItem oi) {
        return OrderItemDto.builder()
                .id(oi.getId())
                .productName(oi.getProduct().getName())
                .quantity(oi.getQuantity())
                .price(oi.getPrice())
                .build();
    }
}
