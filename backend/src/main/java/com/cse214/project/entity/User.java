package com.cse214.project.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "Users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "role_type", nullable = false)
    private String roleType;

    private String phone;

    @Column(name = "address_street")
    private String addressStreet;

    @Column(name = "address_city")
    private String addressCity;

    @Column(name = "address_state")
    private String addressState;

    @Column(name = "address_zip_code")
    private String addressZipCode;

    @Column(name = "address_country")
    private String addressCountry;

    @Column(name = "preferences", columnDefinition = "TEXT")
    private String preferences;
}
