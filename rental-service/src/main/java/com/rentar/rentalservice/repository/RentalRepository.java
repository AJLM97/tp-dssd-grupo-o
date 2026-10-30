package com.rentar.rentalservice.repository;

import com.rentar.rentalservice.entity.Rental;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RentalRepository extends JpaRepository<Rental, Long> {

    List<Rental> findByCustomerId(Long customerId);

    List<Rental> findByVehicleId(Long vehicleId);

    @Query("SELECT r FROM Rental r WHERE r.vehicleId = :vehicleId " +
            "AND r.estado IN ('CONFIRMADA', 'EN_CURSO') " +
            "AND (:fechaInicio < r.fechaFin AND :fechaFin > r.fechaInicio)")
    List<Rental> findOverlappingRentals(@Param("vehicleId") Long vehicleId,
                                        @Param("fechaInicio") LocalDateTime fechaInicio,
                                        @Param("fechaFin") LocalDateTime fechaFin);

    @Query("SELECT r FROM Rental r WHERE r.customerId = :customerId " +
            "AND (r.estado IN ('FINALIZADA', 'CANCELADA') " +
            "OR (r.estado IN ('CONFIRMADA', 'EN_CURSO') AND r.fechaFin < :ahora))")
    List<Rental> findHistoryByCustomerId(@Param("customerId") Long customerId,
                                         @Param("ahora") LocalDateTime ahora);
}