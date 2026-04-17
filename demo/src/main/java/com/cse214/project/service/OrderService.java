package com.cse214.project.service;

import com.cse214.project.dto.order.OrderDetailDto;
import com.cse214.project.dto.order.OrderItemDto;
import com.cse214.project.dto.order.OrderListDto;
import com.cse214.project.entity.Order;
import com.cse214.project.entity.OrderItem;
import com.cse214.project.entity.Store;
import com.cse214.project.entity.User;
import com.cse214.project.repository.OrderItemRepository;
import com.cse214.project.repository.OrderRepository;
import com.cse214.project.repository.StoreRepository;
import com.cse214.project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;

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
            // ADMIN can access all
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
