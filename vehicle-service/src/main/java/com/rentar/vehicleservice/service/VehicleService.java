package com.rentar.vehicleservice.service;

import com.rentar.vehicleservice.entity.EstadoVehiculo;
import com.rentar.vehicleservice.entity.Vehicle;
import com.rentar.vehicleservice.entity.VerificacionVehiculo;
import com.rentar.vehicleservice.kafka.VerificacionSolicitada;
import com.rentar.vehicleservice.repository.VehicleRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import io.grpc.Status;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class VehicleService {

    private final VehicleRepository repository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public VehicleService(VehicleRepository repository, KafkaTemplate<String, Object> kafkaTemplate) {
        this.repository = repository;
        this.kafkaTemplate = kafkaTemplate;
    }

    public Vehicle create(Vehicle vehicle) {
        if (vehicle.getPatente().isBlank()) {
            throw Status.INVALID_ARGUMENT.withDescription("La patente es obligatoria!").asRuntimeException();
        }
        validar(vehicle);
        if (repository.existsByPatente(vehicle.getPatente())) {
            throw Status.ALREADY_EXISTS.withDescription("Ya existe un vehiculo con esa patente!").asRuntimeException();
        }
        Vehicle creado = repository.save(vehicle);
        // La verificacion es asincrona: el alta responde sin esperar el resultado. Si Kafka falla, queda PENDIENTE
        kafkaTemplate.send("vehiculos.verificacion.solicitada", String.valueOf(creado.getId()),
                        new VerificacionSolicitada(creado.getId(), creado.getPatente()))
                .whenComplete((resultado, error) -> {
                    if (error != null) {
                        log.error("No se pudo publicar la verificacion del vehiculo {}", creado.getId(), error);
                    }
                });
        return creado;
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

    // Lo usa el consumidor de vehiculos.verificacion.resultado. Aplicar dos veces el mismo resultado deja el mismo estado
    public void registrarVerificacion(Long id, VerificacionVehiculo resultado) {
        if (id == null || resultado == null || resultado == VerificacionVehiculo.PENDIENTE) {
            throw Status.INVALID_ARGUMENT.withDescription("El resultado de la verificacion no es valido!").asRuntimeException();
        }
        Vehicle vehicle = getById(id);
        vehicle.setVerificacion(resultado);
        // Robado queda inhabilitado. VALIDADO no lo reactiva, para respetar una baja hecha por el admin
        if (resultado == VerificacionVehiculo.ROBADO) {
            vehicle.setActivo(false);
        }
        repository.save(vehicle);
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
