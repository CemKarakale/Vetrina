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
import java.util.List;
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
                orders = orderRepository.findAll();
                break;
            case "CORPORATE":
                Store store = storeRepository.findByOwnerId(user.getId()).orElseThrow();
                orders = orderRepository.findByStoreId(store.getId());
                break;
            default: // INDIVIDUAL
                orders = orderRepository.findByUserId(user.getId());
                break;
        }

        return orders.stream().map(this::toListDto).collect(Collectors.toList());
    }

    public OrderDetailDto getOrderById(Integer id, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sipariş bulunamadı: " + id));

        // Ownership check
        switch (user.getRoleType()) {
            case "CORPORATE":
                Store store = storeRepository.findByOwnerId(user.getId()).orElseThrow();
                if (!order.getStore().getId().equals(store.getId())) {
                    throw new RuntimeException("Bu siparişe erişim yetkiniz yok.");
                }
                break;
            case "INDIVIDUAL":
                if (!order.getUser().getId().equals(user.getId())) {
                    throw new RuntimeException("Bu siparişe erişim yetkiniz yok.");
                }
                break;
        }

        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
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

    public OrderListDto updateOrderStatus(Integer id, String newStatus, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sipariş bulunamadı: " + id));

        // Sadece CORPORATE (kendi mağazası) ve ADMIN durumu güncelleyebilir
        if ("CORPORATE".equals(user.getRoleType())) {
            Store store = storeRepository.findByOwnerId(user.getId()).orElseThrow();
            if (!order.getStore().getId().equals(store.getId())) {
                throw new RuntimeException("Bu siparişin durumunu güncelleme yetkiniz yok.");
            }
        } else if ("INDIVIDUAL".equals(user.getRoleType())) {
            throw new RuntimeException("Bireysel kullanıcılar sipariş durumu güncelleyemez.");
        }

        order.setStatus(newStatus);
        Order saved = orderRepository.save(order);
        return toListDto(saved);
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
