package com.rentar.maintenanceservice.service;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rentar.maintenanceservice.entity.MaintenanceRequest;
import com.rentar.maintenanceservice.entity.MaintenanceStatus;
import com.rentar.maintenanceservice.kafka.MaintenanceResultEvent;
import com.rentar.maintenanceservice.kafka.ReservationConfirmedEvent;
import com.rentar.maintenanceservice.repository.MaintenanceRequestRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;

@Service
public class MaintenanceService {

    private final MaintenanceRequestRepository repository;
    private final ApplicationEventPublisher eventPublisher;

    public MaintenanceService(
            MaintenanceRequestRepository repository,
            ApplicationEventPublisher eventPublisher) {
        this.repository = repository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public MaintenanceRequest procesarReserva(ReservationConfirmedEvent event) {
        if (event.reservaId() <= 0 || event.vehiculoId() <= 0) {
            throw new IllegalArgumentException("La reserva y el vehículo deben tener identificadores válidos");
        }

        LocalDateTime fechaInicio = parsearFecha(event.fechaInicio(), "fechaInicio");
        LocalDateTime fechaFin = parsearFecha(event.fechaFin(), "fechaFin");
        if (!fechaFin.isAfter(fechaInicio)) {
            throw new IllegalArgumentException("La fechaFin debe ser posterior a fechaInicio");
        }

        MaintenanceRequest request = repository.findByReservaId(event.reservaId())
                .orElseGet(() -> nuevaSolicitud(event, fechaInicio, fechaFin));

        if (!request.getVehiculoId().equals(event.vehiculoId())
                || !request.getFechaInicio().equals(fechaInicio)
                || !request.getFechaFin().equals(fechaFin)) {
            throw new IllegalStateException(
                    "La reserva ya tiene una solicitud de mantenimiento con datos diferentes");
        }

        if (request.getResultado() == null) {
            request.setResultado(MaintenanceStatus.REALIZADO);
        }

        MaintenanceRequest savedRequest = repository.saveAndFlush(request);
        eventPublisher.publishEvent(new MaintenanceResultEvent(
                savedRequest.getReservaId(),
                savedRequest.getVehiculoId(),
                savedRequest.getResultado().name()
        ));
        return savedRequest;
    }

    private MaintenanceRequest nuevaSolicitud(
            ReservationConfirmedEvent event,
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin) {
        MaintenanceRequest request = new MaintenanceRequest();
        request.setReservaId(event.reservaId());
        request.setVehiculoId(event.vehiculoId());
        request.setFechaInicio(fechaInicio);
        request.setFechaFin(fechaFin);
        request.setFechaRegistro(LocalDateTime.now());
        return request;
    }

    private LocalDateTime parsearFecha(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("El campo " + fieldName + " es obligatorio");
        }

        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException exception) {
            throw new IllegalArgumentException("El campo " + fieldName + " no tiene un formato ISO válido", exception);
        }
    }
}
