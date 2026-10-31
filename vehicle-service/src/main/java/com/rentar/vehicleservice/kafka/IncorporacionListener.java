package com.rentar.vehicleservice.kafka;

import com.rentar.vehicleservice.entity.VehiculoExterno;
import com.rentar.vehicleservice.service.VehicleService;
import io.grpc.StatusRuntimeException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class IncorporacionListener {

    private final VehicleService vehicleService;

    public IncorporacionListener(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @KafkaListener(topics = "vehiculos.externos.validacion.completada")
    public void incorporar(ValidacionCompletada evento) {
        try {
            VehiculoExterno solicitud = vehicleService.incorporarExterno(evento.vehiculoExternoId());
            log.info("Solicitud {} {}: vehiculo {}", solicitud.getId(), solicitud.getEstado(), solicitud.getVehicleId());
        } catch (StatusRuntimeException e) {
            log.warn("Se descarta la validacion completada {}: {}", evento.eventId(), e.getStatus().getDescription());
        }
    }
}
