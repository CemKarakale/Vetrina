package com.cse214.project.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Store_Settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    private String email;

    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String currency;

    private String timezone;
}