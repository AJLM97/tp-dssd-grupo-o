package com.rentar.vehicleservice.kafka;

import java.time.Instant;
import java.util.UUID;

// Evento vehiculos.externos.registrados: los campos del enunciado mas eventId y fecha para identificarlo
public record VehiculoExternoRegistrado(String eventId, String fecha, Long vehiculoExternoId, Long clienteId, String patente) {

    public VehiculoExternoRegistrado(Long vehiculoExternoId, Long clienteId, String patente) {
        this(UUID.randomUUID().toString(), Instant.now().toString(), vehiculoExternoId, clienteId, patente);
    }
}
