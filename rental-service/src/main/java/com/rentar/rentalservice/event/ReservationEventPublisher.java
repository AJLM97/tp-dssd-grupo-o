package com.rentar.rentalservice.event;

import org.apache.kafka.common.KafkaException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Component
public class ReservationEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(ReservationEventPublisher.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public ReservationEventPublisher(
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void publishReservationConfirmed(ReservationConfirmedEvent event) {
        String payload;
        try {
            payload = objectMapper.writeValueAsString(event);
        } catch (JacksonException exception) {
            log.error("No se pudo serializar el evento de reserva confirmada {}", event.reservaId(), exception);
            return;
        }

        try {
            kafkaTemplate.send(
                    RentalEventTopics.RESERVATION_CONFIRMED,
                    Long.toString(event.reservaId()),
                    payload
            ).whenComplete((result, exception) -> {
                if (exception != null) {
                    log.error("No se pudo publicar el evento de reserva confirmada {}", event.reservaId(), exception);
                }
            });
        } catch (KafkaException exception) {
            log.error("No se pudo enviar el evento de reserva confirmada {}", event.reservaId(), exception);
        }
    }
}
