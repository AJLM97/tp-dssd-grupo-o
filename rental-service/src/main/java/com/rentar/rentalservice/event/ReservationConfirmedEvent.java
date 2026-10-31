package com.rentar.rentalservice.event;

import java.time.Instant;
import java.util.UUID;

// Evento reserva.confirmada: los campos del enunciado mas eventId y fecha para identificarlo
public record ReservationConfirmedEvent(
        String eventId,
        String fecha,
        long reservaId,
        long vehiculoId,
        String fechaInicio,
        String fechaFin) {

    public ReservationConfirmedEvent(long reservaId, long vehiculoId, String fechaInicio, String fechaFin) {
        this(UUID.randomUUID().toString(), Instant.now().toString(), reservaId, vehiculoId, fechaInicio, fechaFin);
    }
}
