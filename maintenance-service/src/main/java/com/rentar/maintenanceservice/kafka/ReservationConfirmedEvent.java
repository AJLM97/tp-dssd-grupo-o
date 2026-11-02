package com.rentar.maintenanceservice.kafka;

// Campos del enunciado. eventId y fecha tambien llegan, pero no se usan y se ignoran al leer el JSON
public record ReservationConfirmedEvent(
        long reservaId,
        long vehiculoId,
        String fechaInicio,
        String fechaFin) {
}
