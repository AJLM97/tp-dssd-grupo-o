package com.rentar.verificationservice.kafka;

import java.time.Instant;
import java.util.UUID;

// Evento vehiculos.verificacion.resultado: los campos del enunciado mas eventId y fecha para identificarlo
public record VerificacionResultado(String eventId, String fecha, Long vehiculoId, String patente, String resultado) {

    public VerificacionResultado(Long vehiculoId, String patente, String resultado) {
        this(UUID.randomUUID().toString(), Instant.now().toString(), vehiculoId, patente, resultado);
    }
}
