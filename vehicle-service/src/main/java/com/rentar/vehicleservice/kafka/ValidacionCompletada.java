package com.rentar.vehicleservice.kafka;

import java.time.Instant;
import java.util.UUID;

// Evento vehiculos.externos.validacion.completada: los campos del enunciado mas eventId y fecha para identificarlo
public record ValidacionCompletada(String eventId, String fecha, Long vehiculoExternoId) {

    public ValidacionCompletada(Long vehiculoExternoId) {
        this(UUID.randomUUID().toString(), Instant.now().toString(), vehiculoExternoId);
    }
}
