package com.rentar.verificationservice.kafka;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.Set;

@Slf4j
@Component
public class VerificacionPolicialListener {

    // Registro policial simulado: patentes con denuncia de robo
    private static final Set<String> PATENTES_ROBADAS = Set.of("ROB001", "ROB002", "ROB003");

    // Demora simulada de la consulta, para que en pantalla se vea el PENDIENTE antes del resultado
    private static final long DEMORA_MS = 5000;

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public VerificacionPolicialListener(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    @KafkaListener(topics = "vehiculos.verificacion.solicitada")
    public void verificar(VerificacionSolicitada solicitud) throws InterruptedException {
        Thread.sleep(DEMORA_MS);
        String resultado = esRobada(solicitud.patente()) ? "ROBADO" : "VALIDADO";
        // join espera la confirmacion de Kafka: si falla, se reintenta y la solicitud no se pierde
        kafkaTemplate.send("vehiculos.verificacion.resultado", String.valueOf(solicitud.vehiculoId()),
                new VerificacionResultado(solicitud.vehiculoId(), solicitud.patente(), resultado)).join();
        log.info("Patente {} verificada: {}", solicitud.patente(), resultado);
    }

    // Mismo registro y mismo grupo, pero para un vehiculo externo el enunciado pide RECHAZADO en vez de ROBADO
    @KafkaListener(topics = "vehiculos.externos.registrados")
    public void verificarExterno(VehiculoExternoRegistrado solicitud) throws InterruptedException {
        Thread.sleep(DEMORA_MS);
        String resultado = esRobada(solicitud.patente()) ? "RECHAZADO" : "VALIDADO";
        kafkaTemplate.send("vehiculos.externos.validacion.patente", String.valueOf(solicitud.vehiculoExternoId()),
                new ValidacionPatente(solicitud.vehiculoExternoId(), solicitud.patente(), resultado)).join();
        log.info("Patente externa {} verificada: {}", solicitud.patente(), resultado);
    }

    private boolean esRobada(String patente) {
        return patente != null && PATENTES_ROBADAS.contains(patente.toUpperCase());
    }
}
