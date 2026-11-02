package com.rentar.vehicleservice.service;

import com.rentar.vehicleservice.entity.EstadoSolicitudExterna;
import com.rentar.vehicleservice.entity.EstadoVehiculo;
import com.rentar.vehicleservice.entity.ResultadoValidacion;
import com.rentar.vehicleservice.entity.TipoVehiculo;
import com.rentar.vehicleservice.entity.Vehicle;
import com.rentar.vehicleservice.entity.VehiculoExterno;
import com.rentar.vehicleservice.entity.VerificacionVehiculo;
import com.rentar.vehicleservice.kafka.ValidacionCompletada;
import com.rentar.vehicleservice.repository.VehicleRepository;
import com.rentar.vehicleservice.repository.VehiculoExternoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.util.Optional;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    @Mock
    private VehicleRepository repository;

    @Mock
    private VehiculoExternoRepository externoRepository;

    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;

    @InjectMocks
    private VehicleService vehicleService;

    @Test
    void conLasDosValidacionesEnValidadoPublicaCompletada() {
        VehiculoExterno solicitud = solicitud(ResultadoValidacion.VALIDADO, null);
        when(externoRepository.findById(1L)).thenReturn(Optional.of(solicitud));
        when(kafkaTemplate.send(eq("vehiculos.externos.validacion.completada"), eq("1"), any(ValidacionCompletada.class)))
                .thenReturn(CompletableFuture.completedFuture(null));

        vehicleService.registrarValidacionExterna(1L, false, ResultadoValidacion.VALIDADO);

        assertEquals(ResultadoValidacion.VALIDADO, solicitud.getResultadoTitularidad());
        assertEquals(EstadoSolicitudExterna.PENDIENTE, solicitud.getEstado());
        verify(kafkaTemplate).send(eq("vehiculos.externos.validacion.completada"), eq("1"), any(ValidacionCompletada.class));
    }

    @Test
    void unRechazadoRechazaLaSolicitudYLaOtraRespuestaSoloSeGuarda() {
        VehiculoExterno solicitud = solicitud(null, null);
        when(externoRepository.findById(1L)).thenReturn(Optional.of(solicitud));

        vehicleService.registrarValidacionExterna(1L, true, ResultadoValidacion.RECHAZADO);
        vehicleService.registrarValidacionExterna(1L, false, ResultadoValidacion.VALIDADO);

        assertEquals(EstadoSolicitudExterna.RECHAZADO, solicitud.getEstado());
        assertEquals(ResultadoValidacion.VALIDADO, solicitud.getResultadoTitularidad());
        verify(externoRepository, times(2)).save(solicitud);
        verifyNoInteractions(kafkaTemplate);
    }

    @Test
    void unaRespuestaRepetidaNoPisaLaPrimera() {
        VehiculoExterno solicitud = solicitud(ResultadoValidacion.RECHAZADO, null);
        solicitud.setEstado(EstadoSolicitudExterna.RECHAZADO);
        when(externoRepository.findById(1L)).thenReturn(Optional.of(solicitud));

        vehicleService.registrarValidacionExterna(1L, true, ResultadoValidacion.VALIDADO);

        assertEquals(ResultadoValidacion.RECHAZADO, solicitud.getResultadoPatente());
        assertEquals(EstadoSolicitudExterna.RECHAZADO, solicitud.getEstado());
        verify(externoRepository, never()).save(any());
    }

    @Test
    void incorporaElVehiculoUnaSolaVez() {
        VehiculoExterno solicitud = solicitud(ResultadoValidacion.VALIDADO, ResultadoValidacion.VALIDADO);
        when(externoRepository.findById(1L)).thenReturn(Optional.of(solicitud));
        when(externoRepository.save(solicitud)).thenReturn(solicitud);
        when(repository.save(any(Vehicle.class))).thenAnswer(invocation -> {
            Vehicle vehicle = invocation.getArgument(0);
            vehicle.setId(20L);
            return vehicle;
        });

        vehicleService.incorporarExterno(1L);
        // El completada repetido no crea otro vehiculo
        vehicleService.incorporarExterno(1L);

        assertEquals(EstadoSolicitudExterna.INCORPORADO, solicitud.getEstado());
        assertEquals(20L, solicitud.getVehicleId());
        ArgumentCaptor<Vehicle> creado = ArgumentCaptor.forClass(Vehicle.class);
        verify(repository, times(1)).save(creado.capture());
        assertEquals("DEF456", creado.getValue().getPatente());
        assertEquals(EstadoVehiculo.DISPONIBLE, creado.getValue().getEstado());
        assertTrue(creado.getValue().isActivo());
        assertEquals(VerificacionVehiculo.VALIDADO, creado.getValue().getVerificacion());
    }

    private VehiculoExterno solicitud(ResultadoValidacion patente, ResultadoValidacion titularidad) {
        VehiculoExterno solicitud = new VehiculoExterno();
        solicitud.setId(1L);
        solicitud.setClienteId(6L);
        solicitud.setPatente("DEF456");
        solicitud.setMarca("Peugeot");
        solicitud.setModelo("208");
        solicitud.setAnio(2022);
        solicitud.setTipo(TipoVehiculo.HATCHBACK);
        solicitud.setPrecioDiario(40000.0);
        solicitud.setResultadoPatente(patente);
        solicitud.setResultadoTitularidad(titularidad);
        return solicitud;
    }
}
