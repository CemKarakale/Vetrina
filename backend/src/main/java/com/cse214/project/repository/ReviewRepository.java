package com.cse214.project.repository;

import com.cse214.project.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {

    List<Review> findByUserId(Integer userId);

    List<Review> findByProductId(Integer productId);

    @Query("SELECT r FROM Review r JOIN FETCH r.user JOIN FETCH r.product")
    List<Review> findAllWithUserAndProduct();

    @Query("SELECT r FROM Review r JOIN FETCH r.user JOIN FETCH r.product WHERE r.product.id = :productId")
    List<Review> findByProductIdWithUserAndProduct(@Param("productId") Integer productId);

    @Query("SELECT r FROM Review r JOIN FETCH r.user JOIN FETCH r.product WHERE r.user.id = :userId")
    List<Review> findByUserIdWithUserAndProduct(@Param("userId") Integer userId);
}