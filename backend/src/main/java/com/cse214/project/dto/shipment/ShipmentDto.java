package com.cse214.project.dto.shipment;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class ShipmentDto {
    private Integer id;
    private Integer orderId;
    private String warehouse;
    private String mode;
    private String status;
    private String trackingNumber;
    private LocalDate estimatedDeliveryDate;
}
