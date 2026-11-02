package com.rentar.vehicleservice.kafka;

import com.rentar.vehicleservice.entity.VerificacionVehiculo;

// Evento vehiculos.verificacion.resultado, lo publica el servicio de verificacion policial
public record VerificacionResultado(String eventId, String fecha, Long vehiculoId, String patente, VerificacionVehiculo resultado) {
}
