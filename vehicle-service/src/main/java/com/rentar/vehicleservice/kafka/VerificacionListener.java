package com.rentar.vehicleservice.kafka;

import com.rentar.vehicleservice.service.VehicleService;
import io.grpc.StatusRuntimeException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class VerificacionListener {

    private final VehicleService vehicleService;

    public VerificacionListener(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @KafkaListener(topics = "vehiculos.verificacion.resultado")
    public void recibirResultado(VerificacionResultado evento) {
        try {
            vehicleService.registrarVerificacion(evento.vehiculoId(), evento.resultado());
            log.info("Vehiculo {} verificado: {}", evento.vehiculoId(), evento.resultado());
        } catch (StatusRuntimeException e) {
            // Un vehiculo inexistente o un resultado invalido no se arreglan reintentando: se descarta el evento
            log.warn("Se descarta el resultado de verificacion {}: {}", evento.eventId(), e.getStatus().getDescription());
        }
    }
}
