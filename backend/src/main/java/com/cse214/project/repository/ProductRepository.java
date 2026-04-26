package com.cse214.project.repository;

import com.cse214.project.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {

    List<Product> findByStoreId(Integer storeId);

    List<Product> findByCategoryId(Integer categoryId);

    List<Product> findByNameContainingIgnoreCase(String name);

    @Query("SELECT p FROM Product p JOIN FETCH p.category JOIN FETCH p.store")
    List<Product> findAllWithCategoryAndStore();

    @Query("SELECT p FROM Product p JOIN FETCH p.category JOIN FETCH p.store WHERE p.store.id = :storeId")
    List<Product> findByStoreIdWithCategoryAndStore(@Param("storeId") Integer storeId);
}