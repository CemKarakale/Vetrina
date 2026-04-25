package com.cse214.project.dto.shipment;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UpdateShipmentRequest {
    private String trackingNumber;
    private String mode;
    private String status;
    private LocalDate estimatedDeliveryDate;
}