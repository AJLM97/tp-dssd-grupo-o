package com.rentar.vehicleservice.kafka;

import com.rentar.vehicleservice.entity.ResultadoValidacion;

// Respuesta de vehiculos.externos.validacion.patente o .titularidad, con los campos que tienen en comun.
// Titularidad ademas trae clienteId y documento, que aca no se usan
public record ValidacionExterna(String eventId, String fecha, Long vehiculoExternoId, String patente, ResultadoValidacion resultado) {
}
