package com.rentar.maintenanceservice.kafka;

public record MaintenanceResultEvent(long reservaId, long vehiculoId, String resultado) {
}
