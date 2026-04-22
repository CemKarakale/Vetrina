package com.cse214.project.controller;

import com.cse214.project.dto.shipment.ShipmentDto;
import com.cse214.project.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipments")
@RequiredArgsConstructor
public class ShipmentController {

    private final ShipmentService shipmentService;

    @GetMapping
    public ResponseEntity<List<ShipmentDto>> getAllShipments(Authentication auth) {
        return ResponseEntity.ok(shipmentService.getAllShipments(auth.getName()));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<ShipmentDto> getShipmentByOrderId(@PathVariable Integer orderId, Authentication auth) {
        return ResponseEntity.ok(shipmentService.getShipmentByOrderId(orderId, auth.getName()));
    }
}
