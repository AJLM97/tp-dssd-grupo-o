package com.rentar.maintenanceservice.kafka;

import org.apache.kafka.common.KafkaException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class MaintenanceResultPublisher {

    private static final Logger log = LoggerFactory.getLogger(MaintenanceResultPublisher.class);
    private static final String TOPIC = "mantenimiento.resultado";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public MaintenanceResultPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    public void publicarResultado(MaintenanceResultEvent event) {
        try {
            kafkaTemplate.send(TOPIC, Long.toString(event.reservaId()), event)
                    .whenComplete((result, exception) -> {
                        if (exception != null) {
                            log.error("No se pudo publicar el resultado del mantenimiento de la reserva {}",
                                    event.reservaId(), exception);
                        }
                    });
        } catch (KafkaException exception) {
            log.error("No se pudo enviar el resultado del mantenimiento de la reserva {}",
                    event.reservaId(), exception);
        }
    }
}
