package com.cse214.project.repository;

import com.cse214.project.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StoreRepository extends JpaRepository<Store, Integer> {
    Optional<Store> findByOwnerId(Integer ownerId);
}
