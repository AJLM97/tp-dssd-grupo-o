package com.rentar.verificationservice.kafka;

import java.time.Instant;
import java.util.UUID;

// Evento vehiculos.externos.validacion.titularidad: los campos del enunciado mas eventId y fecha para identificarlo
public record ValidacionTitularidad(String eventId, String fecha, Long vehiculoExternoId, Long clienteId, String documento,
        String patente, String resultado) {

    public ValidacionTitularidad(Long vehiculoExternoId, Long clienteId, String documento, String patente, String resultado) {
        this(UUID.randomUUID().toString(), Instant.now().toString(), vehiculoExternoId, clienteId, documento, patente, resultado);
    }
}
