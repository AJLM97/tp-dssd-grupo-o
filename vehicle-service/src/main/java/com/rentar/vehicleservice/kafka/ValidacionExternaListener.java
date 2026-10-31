package com.rentar.vehicleservice.kafka;

import com.rentar.vehicleservice.service.VehicleService;
import io.grpc.StatusRuntimeException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ValidacionExternaListener {

    private final VehicleService vehicleService;

    public ValidacionExternaListener(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    // Un solo listener para las dos respuestas: se procesan de a una y no se pisan entre si
    @KafkaListener(topics = {"vehiculos.externos.validacion.patente", "vehiculos.externos.validacion.titularidad"})
    public void recibirValidacion(ValidacionExterna evento, @Header(KafkaHeaders.RECEIVED_TOPIC) String topico) {
        boolean esPatente = topico.equals("vehiculos.externos.validacion.patente");
        try {
            vehicleService.registrarValidacionExterna(evento.vehiculoExternoId(), esPatente, evento.resultado());
            log.info("Solicitud {}: validacion de {} {}", evento.vehiculoExternoId(), esPatente ? "patente" : "titularidad", evento.resultado());
        } catch (StatusRuntimeException e) {
            // Una solicitud inexistente o un resultado invalido no se arreglan reintentando: se descarta el evento
            log.warn("Se descarta la validacion {}: {}", evento.eventId(), e.getStatus().getDescription());
        }
    }
}
