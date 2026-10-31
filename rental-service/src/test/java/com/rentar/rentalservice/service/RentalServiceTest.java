package com.rentar.rentalservice.service;

import com.rentar.rentalservice.entity.MaintenanceStatus;
import com.rentar.rentalservice.entity.Rental;
import com.rentar.rentalservice.event.MaintenanceResultEvent;
import com.rentar.rentalservice.event.ReservationConfirmedEvent;
import com.rentar.rentalservice.grpc.CreateRentalRequest;
import com.rentar.rentalservice.repository.RentalRepository;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RentalServiceTest {

    @Mock
    private RentalRepository repository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private RentalService rentalService;

    @Test
    void createPublishesReservationEventAndStartsMaintenanceAsPending() {
        LocalDateTime start = LocalDateTime.now().plusDays(1).withNano(0);
        LocalDateTime end = start.plusDays(2);
        when(repository.findOverlappingRentals(15L, start, end)).thenReturn(List.of());
        when(repository.saveAndFlush(any(Rental.class))).thenAnswer(invocation -> {
            Rental rental = invocation.getArgument(0);
            rental.setId(150L);
            return rental;
        });

        Rental rental = rentalService.create(CreateRentalRequest.newBuilder()
                .setCustomerId(89L)
                .setVehicleId(15L)
                .setFechaInicio(start.toString())
                .setFechaFin(end.toString())
                .setPrecioDiario(100.0)
                .build());

        assertEquals(MaintenanceStatus.PENDIENTE, rental.getEstadoMantenimiento());
        // eventId y fecha cambian en cada evento: se comparan los demas campos
        ArgumentCaptor<ReservationConfirmedEvent> evento = ArgumentCaptor.forClass(ReservationConfirmedEvent.class);
        verify(eventPublisher).publishEvent(evento.capture());
        assertNotNull(evento.getValue().eventId());
        assertNotNull(evento.getValue().fecha());
        assertEquals(150L, evento.getValue().reservaId());
        assertEquals(15L, evento.getValue().vehiculoId());
        assertEquals(start.toString(), evento.getValue().fechaInicio());
        assertEquals(end.toString(), evento.getValue().fechaFin());
    }

    @Test
    void recordsMaintenanceResultForMatchingReservationAndVehicle() {
        Rental rental = new Rental();
        rental.setId(150L);
        rental.setVehicleId(15L);
        rental.setEstadoMantenimiento(MaintenanceStatus.PENDIENTE);
        when(repository.findById(150L)).thenReturn(Optional.of(rental));
        when(repository.saveAndFlush(rental)).thenReturn(rental);

        rentalService.recordMaintenanceResult(new MaintenanceResultEvent(150L, 15L, "REALIZADO"));

        assertEquals(MaintenanceStatus.REALIZADO, rental.getEstadoMantenimiento());
        verify(repository).saveAndFlush(rental);
    }

    @Test
    void rejectsMaintenanceResultForDifferentVehicle() {
        Rental rental = new Rental();
        rental.setId(150L);
        rental.setVehicleId(15L);
        rental.setEstadoMantenimiento(MaintenanceStatus.PENDIENTE);
        when(repository.findById(150L)).thenReturn(Optional.of(rental));

        StatusRuntimeException exception = assertThrows(StatusRuntimeException.class, () ->
                rentalService.recordMaintenanceResult(
                        new MaintenanceResultEvent(150L, 16L, "REALIZADO")));

        assertEquals(Status.Code.FAILED_PRECONDITION, exception.getStatus().getCode());
    }
}
