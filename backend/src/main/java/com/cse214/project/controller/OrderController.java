package com.cse214.project.controller;

import com.cse214.project.dto.order.OrderCreateRequest;
import com.cse214.project.dto.order.OrderDetailDto;
import com.cse214.project.dto.order.OrderListDto;
import com.cse214.project.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<List<OrderListDto>> getAllOrders(Authentication auth) {
        return ResponseEntity.ok(orderService.getAllOrders(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDetailDto> getOrderById(@PathVariable Integer id, Authentication auth) {
        return ResponseEntity.ok(orderService.getOrderById(id, auth.getName()));
    }

    @PostMapping
    public ResponseEntity<OrderDetailDto> createOrder(@Valid @RequestBody OrderCreateRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(request, auth.getName()));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<OrderListDto> updateOrderStatus(
            @PathVariable Integer id,
            @Valid @RequestBody com.cse214.project.dto.order.OrderStatusUpdateRequest request,
            Authentication auth) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, request.getStatus(), auth.getName()));
    }
}
