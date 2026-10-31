package com.rentar.maintenanceservice.kafka;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.rentar.maintenanceservice.service.MaintenanceService;

@Slf4j
@Component
public class ReservationConfirmedListener {

    private final MaintenanceService maintenanceService;

    public ReservationConfirmedListener(MaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    @KafkaListener(topics = "reserva.confirmada")
    public void recibirReservaConfirmada(ReservationConfirmedEvent event) {
        maintenanceService.procesarReserva(event);
        log.info("Solicitud de mantenimiento preventivo registrada para la reserva {}", event.reservaId());
    }
}
