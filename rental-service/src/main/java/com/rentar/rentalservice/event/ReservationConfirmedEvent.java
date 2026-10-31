package com.rentar.rentalservice.event;

public record ReservationConfirmedEvent(
        long reservaId,
        long vehiculoId,
        String fechaInicio,
        String fechaFin) {
}
