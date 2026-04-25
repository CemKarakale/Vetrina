package com.cse214.project.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Customer_Profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private Integer age;

    private String city;

    @Column(name = "membership_type")
    private String membershipType;
}
