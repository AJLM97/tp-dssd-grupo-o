package com.rentar.maintenanceservice.kafka;

import java.time.Instant;
import java.util.UUID;

// Evento mantenimiento.resultado: los campos del enunciado mas eventId y fecha para identificarlo
public record MaintenanceResultEvent(String eventId, String fecha, long reservaId, long vehiculoId, String resultado) {

    public MaintenanceResultEvent(long reservaId, long vehiculoId, String resultado) {
        this(UUID.randomUUID().toString(), Instant.now().toString(), reservaId, vehiculoId, resultado);
    }
}
