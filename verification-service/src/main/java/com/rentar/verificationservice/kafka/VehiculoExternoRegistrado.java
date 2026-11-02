package com.rentar.verificationservice.kafka;

// Evento vehiculos.externos.registrados, lo publica vehicle-service cuando un cliente registra su vehiculo
public record VehiculoExternoRegistrado(String eventId, String fecha, Long vehiculoExternoId, Long clienteId, String patente) {
}
