package com.rentar.vehicleservice.repository;

import com.rentar.vehicleservice.entity.EstadoSolicitudExterna;
import com.rentar.vehicleservice.entity.VehiculoExterno;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehiculoExternoRepository extends JpaRepository<VehiculoExterno, Long> {
    List<VehiculoExterno> findByClienteId(Long clienteId);

    boolean existsByPatenteAndEstado(String patente, EstadoSolicitudExterna estado);
}
