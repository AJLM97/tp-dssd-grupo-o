package com.rentar.verificationservice.kafka;

import com.rentar.customerservice.grpc.CustomerServiceGrpc;
import com.rentar.customerservice.grpc.GetCustomerByIdRequest;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
public class TitularidadListener {

    // Registro automotor simulado: patente -> documento del titular
    private static final Map<String, String> TITULARES = Map.of("DEF456", "30123456", "ROB002", "30123456", "GHI789", "99999999");

    // Misma demora que la verificacion policial
    private static final long DEMORA_MS = 5000;

    @GrpcClient("customer-service")
    private CustomerServiceGrpc.CustomerServiceBlockingStub customerStub;

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public TitularidadListener(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    // Grupo propio: recibe todas las solicitudes, igual que la policia, y las dos validaciones corren en paralelo
    @KafkaListener(topics = "vehiculos.externos.registrados", groupId = "verificacion-titularidad")
    public void verificar(VehiculoExternoRegistrado solicitud) throws InterruptedException {
        Thread.sleep(DEMORA_MS);
        // El evento solo trae el clienteId: el documento se lo pedimos a customer-service.
        // Si no responde, la excepcion hace que Kafka reintente el evento
        String documento = customerStub.getCustomerById(GetCustomerByIdRequest.newBuilder().setId(solicitud.clienteId()).build())
                .getCustomer().getDocumento();
        boolean esTitular = solicitud.patente() != null && documento.equals(TITULARES.get(solicitud.patente().toUpperCase()));
        String resultado = esTitular ? "VALIDADO" : "RECHAZADO";
        kafkaTemplate.send("vehiculos.externos.validacion.titularidad", String.valueOf(solicitud.vehiculoExternoId()),
                new ValidacionTitularidad(solicitud.vehiculoExternoId(), solicitud.clienteId(), documento, solicitud.patente(), resultado)).join();
        log.info("Titularidad de {} para el documento {}: {}", solicitud.patente(), documento, resultado);
    }
}
