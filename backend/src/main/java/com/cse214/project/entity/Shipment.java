package com.cse214.project.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "Shipments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    private String warehouse;

    private String mode;

    private String status;

    private String trackingNumber;

    private LocalDate estimatedDeliveryDate;
}
