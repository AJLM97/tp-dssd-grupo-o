package com.rentar.rentalservice.event;

import com.rentar.rentalservice.service.RentalService;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class MaintenanceResultConsumer {

    private final ObjectMapper objectMapper;
    private final RentalService rentalService;

    public MaintenanceResultConsumer(ObjectMapper objectMapper, RentalService rentalService) {
        this.objectMapper = objectMapper;
        this.rentalService = rentalService;
    }

    @KafkaListener(topics = RentalEventTopics.MAINTENANCE_RESULT)
    public void consume(String payload) {
        MaintenanceResultEvent event;
        try {
            event = objectMapper.readValue(payload, MaintenanceResultEvent.class);
        } catch (JacksonException exception) {
            throw new IllegalArgumentException("El evento de resultado de mantenimiento no tiene un JSON válido", exception);
        }

        rentalService.recordMaintenanceResult(event);
    }
}
