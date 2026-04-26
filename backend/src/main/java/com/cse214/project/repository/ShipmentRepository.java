package com.cse214.project.repository;

import com.cse214.project.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Integer> {

    Optional<Shipment> findByOrderId(Integer orderId);

    @Query("SELECT s FROM Shipment s JOIN FETCH s.order WHERE s.order.id = :orderId")
    Optional<Shipment> findByOrderIdWithOrder(@Param("orderId") Integer orderId);

    @Query("SELECT s FROM Shipment s JOIN FETCH s.order WHERE s.order.store.id = :storeId")
    List<Shipment> findByOrderStoreIdWithOrder(@Param("storeId") Integer storeId);

    @Query("SELECT s FROM Shipment s JOIN FETCH s.order WHERE s.order.user.id = :userId")
    List<Shipment> findByOrderUserIdWithOrder(@Param("userId") Integer userId);

    @Query("SELECT s FROM Shipment s JOIN FETCH s.order")
    List<Shipment> findAllWithOrder();
}