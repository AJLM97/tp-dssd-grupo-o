package com.rentar.vehicleservice.kafka;

import java.time.Instant;
import java.util.UUID;

// Evento vehiculos.verificacion.solicitada: los campos del enunciado mas eventId y fecha para identificarlo
public record VerificacionSolicitada(String eventId, String fecha, Long vehiculoId, String patente) {

    public VerificacionSolicitada(Long vehiculoId, String patente) {
        this(UUID.randomUUID().toString(), Instant.now().toString(), vehiculoId, patente);
    }
}
