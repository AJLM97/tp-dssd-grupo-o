package com.rentar.maintenanceservice.kafka;

public record ReservationConfirmedEvent(
        long reserva_id,
        long vehiculo_id,
        String fecha_inicio,
        String fecha_fin) {
}
