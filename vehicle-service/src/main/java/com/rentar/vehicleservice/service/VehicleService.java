package com.rentar.vehicleservice.service;

import com.rentar.vehicleservice.entity.Vehicle;
import com.rentar.vehicleservice.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import io.grpc.Status;

import java.util.List;

@Service
public class VehicleService {

    private final VehicleRepository repository;

    public VehicleService(VehicleRepository repository){
        this.repository = repository;
    }

    public Vehicle getById(long id) {

        if (id <= 0) {
            throw Status.INVALID_ARGUMENT.withDescription("El ID debe ser mayor a cero!").asRuntimeException();
        }
        return repository.findById(id).orElseThrow(() -> Status.NOT_FOUND.withDescription("Vehiculo no encontrado").asRuntimeException());
    }

    public List<Vehicle> getAll(boolean soloActivos){
        return soloActivos ? repository.findByActivoTrue() : repository.findAll();
    }
}
