package com.cse214.project.repository;

import com.cse214.project.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    List<Order> findByUserId(Integer userId);

    List<Order> findByStoreId(Integer storeId);

    @Query("SELECT o FROM Order o JOIN FETCH o.user JOIN FETCH o.store")
    List<Order> findAllWithUserAndStore();

    @Query("SELECT o FROM Order o JOIN FETCH o.user JOIN FETCH o.store WHERE o.user.id = :userId")
    List<Order> findByUserIdWithUserAndStore(@Param("userId") Integer userId);

    @Query("SELECT o FROM Order o JOIN FETCH o.user JOIN FETCH o.store WHERE o.store.id = :storeId")
    List<Order> findByStoreIdWithUserAndStore(@Param("storeId") Integer storeId);

    @Query("SELECT o FROM Order o JOIN FETCH o.user JOIN FETCH o.store WHERE o.id = :id")
    Optional<Order> findByIdWithUserAndStore(@Param("id") Integer id);
}