package com.rentar.vehicleservice.service;

import com.rentar.vehicleservice.entity.EstadoVehiculo;
import com.rentar.vehicleservice.entity.Vehicle;
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

    public Vehicle create(Vehicle vehicle) {
        if (vehicle.getPatente().isBlank()) {
            throw Status.INVALID_ARGUMENT.withDescription("La patente es obligatoria!").asRuntimeException();
        }
        validar(vehicle);
        if (repository.existsByPatente(vehicle.getPatente())) {
            throw Status.ALREADY_EXISTS.withDescription("Ya existe un vehiculo con esa patente!").asRuntimeException();
        }
        return repository.save(vehicle);
    }

    public Vehicle update(long id, Vehicle datos) {
        Vehicle vehicle = getById(id);
        validar(datos);
        vehicle.setMarca(datos.getMarca());
        vehicle.setModelo(datos.getModelo());
        vehicle.setAnio(datos.getAnio());
        vehicle.setColor(datos.getColor());
        vehicle.setTipo(datos.getTipo());
        vehicle.setPrecioDiario(datos.getPrecioDiario());
        return repository.save(vehicle);
    }

    public Vehicle delete(long id) {
        Vehicle vehicle = getById(id);
        vehicle.setActivo(false);
        return repository.save(vehicle);
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

    private void validar(Vehicle vehicle) {
        if (vehicle.getMarca().isBlank()) {
            throw Status.INVALID_ARGUMENT.withDescription("La marca es obligatoria!").asRuntimeException();
        }
        if (vehicle.getModelo().isBlank()) {
            throw Status.INVALID_ARGUMENT.withDescription("El modelo es obligatorio!").asRuntimeException();
        }
        if (vehicle.getAnio() <= 0) {
            throw Status.INVALID_ARGUMENT.withDescription("El año debe ser mayor a cero!").asRuntimeException();
        }
        if (!Double.isFinite(vehicle.getPrecioDiario()) || vehicle.getPrecioDiario() <= 0) {
            throw Status.INVALID_ARGUMENT.withDescription("El precio diario debe ser mayor a cero!").asRuntimeException();
        }
    }
}
