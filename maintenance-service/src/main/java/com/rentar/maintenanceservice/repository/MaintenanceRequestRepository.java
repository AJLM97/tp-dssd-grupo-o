package com.rentar.maintenanceservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rentar.maintenanceservice.entity.MaintenanceRequest;

import java.util.Optional;

public interface MaintenanceRequestRepository extends JpaRepository<MaintenanceRequest, Long> {

    Optional<MaintenanceRequest> findByReservaId(Long reservaId);
}
