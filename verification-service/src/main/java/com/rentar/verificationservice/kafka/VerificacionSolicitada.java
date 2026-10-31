package com.rentar.verificationservice.kafka;

// Evento vehiculos.verificacion.solicitada, lo publica vehicle-service al dar de alta un vehiculo
public record VerificacionSolicitada(String eventId, String fecha, Long vehiculoId, String patente) {
}
