package com.rentar.rentalservice.service;

import com.rentar.rentalservice.entity.Rental;
import com.rentar.rentalservice.entity.RentalStatus;
import com.rentar.rentalservice.entity.MaintenanceStatus;
import com.rentar.rentalservice.grpc.CancelRentalRequest;
import com.rentar.rentalservice.grpc.CreateRentalRequest;
import com.rentar.rentalservice.event.MaintenanceResultEvent;
import com.rentar.rentalservice.event.ReservationConfirmedEvent;
import com.rentar.rentalservice.repository.RentalRepository;

import io.grpc.Status;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
@Transactional
public class RentalService {

    private final RentalRepository repository;
    private final ApplicationEventPublisher eventPublisher;

    public RentalService(RentalRepository repository, ApplicationEventPublisher eventPublisher) {
        this.repository = repository;
        this.eventPublisher = eventPublisher;
    }

    public Rental create(CreateRentalRequest request) {
        long customerId = validateId(request.getCustomerId(), "customerId");
        long vehicleId = validateId(request.getVehicleId(), "vehicleId");
        double precioDiario = request.getPrecioDiario();

        if (precioDiario <= 0) {
            throw invalid("El precio diario debe ser mayor que cero");
        }

        LocalDateTime fechaInicio = parseDateTime(request.getFechaInicio(), "fecha_inicio");
        LocalDateTime fechaFin = parseDateTime(request.getFechaFin(), "fecha_fin");

        if (fechaInicio.isBefore(LocalDateTime.now())) {
            throw invalid("La fecha de inicio debe ser futura");
        }

        if (!fechaFin.isAfter(fechaInicio)) {
            throw invalid("La fecha de finalización debe ser posterior a la fecha de inicio");
        }

        List<Rental> overlapping = repository.findOverlappingRentals(vehicleId, fechaInicio, fechaFin);
        if (!overlapping.isEmpty()) {
            throw Status.ALREADY_EXISTS
                    .withDescription("El vehículo ya cuenta con una reserva confirmada en el período solicitado")
                    .asRuntimeException();
        }

        long dias = calcularDias(fechaInicio, fechaFin);
        double importeTotal = dias * precioDiario;

        Rental rental = new Rental();
        rental.setCustomerId(customerId);
        rental.setVehicleId(vehicleId);
        rental.setFechaInicio(fechaInicio);
        rental.setFechaFin(fechaFin);
        rental.setPrecioDiario(precioDiario);
        rental.setImporteTotal(importeTotal);
        rental.setEstado(RentalStatus.CONFIRMADA);
        rental.setEstadoMantenimiento(MaintenanceStatus.PENDIENTE);

        Rental savedRental = repository.saveAndFlush(rental);
        eventPublisher.publishEvent(new ReservationConfirmedEvent(
                savedRental.getId(),
                savedRental.getVehicleId(),
                savedRental.getFechaInicio().toString(),
                savedRental.getFechaFin().toString()
        ));
        return savedRental;
    }

    public void recordMaintenanceResult(MaintenanceResultEvent event) {
        long rentalId = validateId(event.reservaId(), "reservaId");
        long vehicleId = validateId(event.vehiculoId(), "vehiculoId");
        MaintenanceStatus result = switch (event.resultado() == null ? "" : event.resultado()) {
            case "REALIZADO" -> MaintenanceStatus.REALIZADO;
            case "NO_REALIZADO" -> MaintenanceStatus.NO_REALIZADO;
            default -> throw invalid("El resultado del mantenimiento debe ser REALIZADO o NO_REALIZADO");
        };

        Rental rental = getById(rentalId);
        if (!rental.getVehicleId().equals(vehicleId)) {
            throw Status.FAILED_PRECONDITION
                    .withDescription("El vehículo del resultado no coincide con el de la reserva")
                    .asRuntimeException();
        }

        MaintenanceStatus currentStatus = rental.getEstadoMantenimiento();
        if (currentStatus != null
                && currentStatus != MaintenanceStatus.PENDIENTE
                && currentStatus != result) {
            throw Status.FAILED_PRECONDITION
                    .withDescription("La reserva ya tiene un resultado de mantenimiento diferente")
                    .asRuntimeException();
        }

        rental.setEstadoMantenimiento(result);
        repository.saveAndFlush(rental);
    }

    public Rental cancel(CancelRentalRequest request) {
        long rentalId = validateId(request.getRentalId(), "rentalId");
        Rental rental = getById(rentalId);

        if (request.getCustomerId() > 0 && !rental.getCustomerId().equals(request.getCustomerId())) {
            throw Status.PERMISSION_DENIED
                    .withDescription("La reserva no pertenece al cliente indicado")
                    .asRuntimeException();
        }

        if (rental.getFechaInicio().isBefore(LocalDateTime.now())) {
            throw Status.FAILED_PRECONDITION
                    .withDescription("No es posible cancelar una reserva cuyo período ya ha comenzado")
                    .asRuntimeException();
        }

        rental.setEstado(RentalStatus.CANCELADA);
        return repository.saveAndFlush(rental);
    }

    @Transactional(readOnly = true)
    public Rental getById(long id) {
        validateId(id, "id");
        return repository.findById(id)
                .orElseThrow(() -> Status.NOT_FOUND
                        .withDescription("No existe una reserva con el ID especificado")
                        .asRuntimeException());
    }

    @Transactional(readOnly = true)
    public List<Rental> getAll(long customerId, long vehicleId) {
        if (customerId > 0) {
            return repository.findByCustomerId(customerId);
        }
        if (vehicleId > 0) {
            return repository.findByVehicleId(vehicleId);
        }
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Rental> getHistory(long customerId) {
        validateId(customerId, "customerId");
        return repository.findHistoryByCustomerId(customerId, LocalDateTime.now());
    }

    // Regla del Hito 1: max(1, ceil(duración / 24 h)). La usan el importe y la cantidad de días que se informa
    public static long calcularDias(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        double dias = Duration.between(fechaInicio, fechaFin).toMillis() / (double) Duration.ofDays(1).toMillis();
        return Math.max(1, (long) Math.ceil(dias));
    }

    // Una reserva confirmada o en curso cuyo período ya terminó se informa como FINALIZADA (igual que en el Hito 1)
    public static RentalStatus estadoEfectivo(Rental rental) {
        boolean activa = rental.getEstado() == RentalStatus.CONFIRMADA || rental.getEstado() == RentalStatus.EN_CURSO;
        if (activa && rental.getFechaFin().isBefore(LocalDateTime.now())) {
            return RentalStatus.FINALIZADA;
        }
        return rental.getEstado();
    }

    private long validateId(long id, String fieldName) {
        if (id <= 0) {
            throw invalid("El campo " + fieldName + " debe tener un valor válido mayor que cero");
        }
        return id;
    }

    private LocalDateTime parseDateTime(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw invalid("El campo " + fieldName + " es obligatorio");
        }

        try {
            return LocalDateTime.parse(value.trim());
        } catch (DateTimeParseException exception) {
            throw invalid("El campo " + fieldName + " debe tener un formato ISO válido (AAAA-MM-DDTHH:mm:ss)");
        }
    }

    private RuntimeException invalid(String message) {
        return Status.INVALID_ARGUMENT
                .withDescription(message)
                .asRuntimeException();
    }
}