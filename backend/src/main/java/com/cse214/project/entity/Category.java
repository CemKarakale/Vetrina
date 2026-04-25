package com.cse214.project.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Category parentCategory;
}
