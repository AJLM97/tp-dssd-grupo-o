package com.rentar.verificationservice.kafka;

import java.time.Instant;
import java.util.UUID;

// Evento vehiculos.externos.validacion.patente: los campos del enunciado mas eventId y fecha para identificarlo
public record ValidacionPatente(String eventId, String fecha, Long vehiculoExternoId, String patente, String resultado) {

    public ValidacionPatente(Long vehiculoExternoId, String patente, String resultado) {
        this(UUID.randomUUID().toString(), Instant.now().toString(), vehiculoExternoId, patente, resultado);
    }
}
