package com.rentar.vehicleservice.service;

import com.rentar.vehicleservice.entity.EstadoVehiculo;
import com.rentar.vehicleservice.entity.TipoVehiculo;
import com.rentar.vehicleservice.entity.Vehicle;
import com.rentar.vehicleservice.grpc.CreateVehicleRequest;
import com.rentar.vehicleservice.grpc.UpdateVehicleRequest;
import com.rentar.vehicleservice.grpc.VehicleType;
import com.rentar.vehicleservice.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import io.grpc.Status;

import java.util.List;
import java.util.Optional;

@Service
public class VehicleService {

    private final VehicleRepository repository;

    public VehicleService(VehicleRepository repository) {
        this.repository = repository;
    }

    public Vehicle create(CreateVehicleRequest request) {
        if (request == null) {
            throw Status.INVALID_ARGUMENT
                    .withDescription("La solicitud es obligatoria")
                    .asRuntimeException();
        }

        String patente = request.getPatente().trim();
        String marca = request.getMarca().trim();
        String modelo = request.getModelo().trim();
        int anio = request.getAnio();
        double precioDiario = request.getPrecioDiario();

        if (patente.isBlank()) {
            throw Status.INVALID_ARGUMENT
                    .withDescription("La patente es obligatoria")
                    .asRuntimeException();
        }
        if (marca.isBlank()) {
            throw Status.INVALID_ARGUMENT
                    .withDescription("La marca es obligatoria")
                    .asRuntimeException();
        }
        if (modelo.isBlank()) {
            throw Status.INVALID_ARGUMENT
                    .withDescription("El modelo es obligatorio")
                    .asRuntimeException();
        }
        if (anio <= 0) {
            throw Status.INVALID_ARGUMENT
                    .withDescription("El año debe ser mayor que cero")
                    .asRuntimeException();
        }
        if (!Double.isFinite(precioDiario) || precioDiario <= 0) {
            throw Status.INVALID_ARGUMENT
                    .withDescription("El precio diario debe ser mayor que cero")
                    .asRuntimeException();
        }

        if (request.getTipo() == VehicleType.VEHICLE_TYPE_UNSPECIFIED
                || request.getTipo() == VehicleType.UNRECOGNIZED) {
            throw Status.INVALID_ARGUMENT
                    .withDescription("El tipo de vehículo es obligatorio")
                    .asRuntimeException();
        }

        if (repository.existsByPatente(patente)) {
            throw Status.ALREADY_EXISTS
                    .withDescription("Ya existe un vehículo con esa patente")
                    .asRuntimeException();
        }

        Vehicle vehicle = new Vehicle();
        vehicle.setPatente(patente);
        vehicle.setMarca(marca);
        vehicle.setModelo(modelo);
        vehicle.setAnio(anio);
        vehicle.setColor(request.getColor().isBlank() ? null : request.getColor().trim());
        vehicle.setTipo(TipoVehiculo.valueOf(request.getTipo().name()));
        vehicle.setPrecioDiario(precioDiario);

        return repository.saveAndFlush(vehicle);
    }

    public Vehicle update(UpdateVehicleRequest request) {
        Vehicle vehicle = getById(request.getId());

        String marca = required(request.getMarca(), "marca");
        String modelo = required(request.getModelo(), "modelo");
        int anio = request.getAnio();
        double precioDiario = request.getPrecioDiario();
        TipoVehiculo tipo = validateTipo(request.getTipo());

        if (anio <= 0) {
            throw Status.INVALID_ARGUMENT
                    .withDescription("El año debe ser mayor que cero")
                    .asRuntimeException();
        }

        if (!Double.isFinite(precioDiario) || precioDiario <= 0) {
            throw Status.INVALID_ARGUMENT
                    .withDescription("El precio diario debe ser mayor que cero")
                    .asRuntimeException();
        }

        vehicle.setMarca(marca);
        vehicle.setModelo(modelo);
        vehicle.setAnio(anio);
        vehicle.setColor(request.getColor().isBlank()
                ? null
                : request.getColor().trim());
        vehicle.setTipo(tipo);
        vehicle.setPrecioDiario(precioDiario);

        return repository.saveAndFlush(vehicle);
    }

    public Vehicle getById(long id) {
        return findById(id).orElseThrow(() -> Status.NOT_FOUND.withDescription("Vehiculo no encontrado").asRuntimeException());
    }

    public Optional<Vehicle> findById(long id) {

        if (id <= 0) {
            throw Status.INVALID_ARGUMENT.withDescription("El ID debe ser mayor a cero!").asRuntimeException();
        }
        return repository.findById(id);
    }

    public List<Vehicle> getAll(boolean soloActivos) {
        return soloActivos ? repository.findByActivoTrue() : repository.findAll();
    }

    public Vehicle updateStatus(long id, EstadoVehiculo nuevoEstado) {
        Vehicle vehicle = getById(id);
        vehicle.setEstado(nuevoEstado);
        return repository.save(vehicle);
    }

    private TipoVehiculo validateTipo(VehicleType tipo) {
        if (tipo == VehicleType.VEHICLE_TYPE_UNSPECIFIED
                || tipo == VehicleType.UNRECOGNIZED) {
            throw Status.INVALID_ARGUMENT
                    .withDescription("El tipo de vehículo es obligatorio")
                    .asRuntimeException();
        }

        return TipoVehiculo.valueOf(tipo.name());
    }

    private String required(String value, String field) {
        String result = value.trim();

        if (result.isEmpty()) {
            throw invalid("El campo " + field + " es obligatorio");
        }

        if (result.length() > 255) {
            throw invalid("El campo " + field + " supera los 255 caracteres");
        }

        return result;
    }

    private RuntimeException invalid(String message) {
        return Status.INVALID_ARGUMENT
                .withDescription(message)
                .asRuntimeException();
    }
}
