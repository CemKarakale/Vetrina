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

    @Query("SELECT s FROM Shipment s WHERE s.order.store.id = :storeId")
    List<Shipment> findByOrderStoreId(@Param("storeId") Integer storeId);

    @Query("SELECT s FROM Shipment s WHERE s.order.user.id = :userId")
    List<Shipment> findByOrderUserId(@Param("userId") Integer userId);
}
