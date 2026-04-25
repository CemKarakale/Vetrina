package com.cse214.project.service;

import com.cse214.project.dto.shipment.ShipmentDto;
import com.cse214.project.entity.Order;
import com.cse214.project.entity.Shipment;
import com.cse214.project.entity.Store;
import com.cse214.project.entity.User;
import com.cse214.project.repository.OrderRepository;
import com.cse214.project.repository.ShipmentRepository;
import com.cse214.project.repository.StoreRepository;
import com.cse214.project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final StoreRepository storeRepository;

    public List<ShipmentDto> getAllShipments(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();

        List<Shipment> shipments;
        switch (user.getRoleType()) {
            case "ADMIN":
                shipments = shipmentRepository.findAll();
                break;
            case "CORPORATE":
                Store store = storeRepository.findByOwnerId(user.getId()).orElseThrow();
                shipments = shipmentRepository.findByOrderStoreId(store.getId());
                break;
            case "INDIVIDUAL":
                shipments = shipmentRepository.findByOrderUserId(user.getId());
                break;
            default:
                shipments = List.of();
        }

        return shipments.stream().map(this::toDto).collect(Collectors.toList());
    }

    public ShipmentDto getShipmentByOrderId(Integer orderId, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Sipariş bulunamadı: " + orderId));

        // Ownership check
        switch (user.getRoleType()) {
            case "CORPORATE":
                Store store = storeRepository.findByOwnerId(user.getId()).orElseThrow();
                if (!order.getStore().getId().equals(store.getId())) {
                    throw new RuntimeException("Bu kargo bilgisine erişim yetkiniz yok.");
                }
                break;
            case "INDIVIDUAL":
                if (!order.getUser().getId().equals(user.getId())) {
                    throw new RuntimeException("Bu kargo bilgisine erişim yetkiniz yok.");
                }
                break;
        }

        Shipment shipment = shipmentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Bu sipariş için kargo bilgisi bulunamadı."));

        return toDto(shipment);
    }

    private ShipmentDto toDto(Shipment s) {
        return ShipmentDto.builder()
                .id(s.getId())
                .orderId(s.getOrder().getId())
                .warehouse(s.getWarehouse())
                .mode(s.getMode())
                .status(s.getStatus())
                .build();
    }
}
