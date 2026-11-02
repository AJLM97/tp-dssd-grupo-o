package com.rentar.rentalservice.event;

public record MaintenanceResultEvent(
        long reservaId,
        long vehiculoId,
        String resultado) {
}
