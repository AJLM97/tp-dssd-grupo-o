package com.rentar.vehicleservice.grpc;

import com.rentar.vehicleservice.entity.EstadoVehiculo;
import com.rentar.vehicleservice.entity.Vehicle;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import com.rentar.vehicleservice.service.VehicleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;
import java.util.function.Supplier;

@GrpcService
public class VehicleGrpcService extends VehicleServiceGrpc.VehicleServiceImplBase {

    private final VehicleService vehicleService;

    public VehicleGrpcService(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    private static final Logger log = LoggerFactory.getLogger(VehicleGrpcService.class);

    @Override
    public void createVehicle(
            CreateVehicleRequest request,
            StreamObserver<VehicleResponse> responseObserver) {

        respond(responseObserver, () -> toResponse(vehicleService.create(request)));
    }

    @Override
    public void updateVehicle(
            UpdateVehicleRequest request,
            StreamObserver<VehicleResponse> responseObserver) {

        respond(responseObserver,
                () -> toResponse(vehicleService.update(request)));
    }

    @Override
    public void getVehicleById(GetVehicleByIdRequest request, StreamObserver<VehicleResponse> responseObserver) {

        try {
            Vehicle vehicle = vehicleService.getById(request.getId());
            responseObserver.onNext(toResponse(vehicle));
            responseObserver.onCompleted();
        } catch (StatusRuntimeException e) {
            responseObserver.onError(e);
        }
    }

    @Override
    public void getVehicles(GetVehiclesRequest request, StreamObserver<GetVehiclesResponse> responseObserver) {
        GetVehiclesResponse.Builder response = GetVehiclesResponse.newBuilder();

        for (Vehicle vehicle : vehicleService.getAll(request.getSoloActivos())) {
            response.addVehicles(toResponse(vehicle));
        }

        responseObserver.onNext(response.build());
        responseObserver.onCompleted();
    }

    @Override
    public void updateVehicleStatus(UpdateVehicleStatusRequest request, StreamObserver<VehicleResponse> responseObserver) {

        try {
            if (request.getNuevoEstado() == VehicleStatus.VEHICLE_STATUS_UNSPECIFIED || request.getNuevoEstado() == VehicleStatus.UNRECOGNIZED) {
                throw Status.INVALID_ARGUMENT.withDescription("El nuevo estado no es valido!").asRuntimeException();
            }
            EstadoVehiculo nuevoEstado = EstadoVehiculo.valueOf(request.getNuevoEstado().name());
            Vehicle vehicle = vehicleService.updateStatus(request.getId(), nuevoEstado);
            responseObserver.onNext(toResponse(vehicle));
            responseObserver.onCompleted();
        } catch (StatusRuntimeException e) {
            responseObserver.onError(e);
        }
    }

    @Override
    public void checkAvailability(CheckAvailabilityRequest request, StreamObserver<CheckAvailabilityResponse> responseObserver) {

        // Las fechas no se usan: la superposicion de reservas la valida rental-service (acordado con el equipo)
        try {
            Optional<Vehicle> vehicle = vehicleService.findById(request.getVehicleId());
            boolean disponible = vehicle.isPresent() && vehicle.get().isActivo();
            String mensaje;

            if (vehicle.isEmpty()) {
                mensaje = "El vehiculo no existe";
            } else if (!disponible) {
                mensaje = "El vehiculo se encuentra inactivo";
            } else {
                mensaje = "Vehiculo disponible";
            }

            responseObserver.onNext(CheckAvailabilityResponse.newBuilder()
                    .setDisponible(disponible)
                    .setMensaje(mensaje)
                    .build());
            responseObserver.onCompleted();
        } catch (StatusRuntimeException e) {
            responseObserver.onError(e);
        }
    }

    private VehicleResponse toResponse(Vehicle vehicle) {
        return VehicleResponse.newBuilder()
                .setId(vehicle.getId())
                .setPatente(vehicle.getPatente())
                .setMarca(vehicle.getMarca())
                .setModelo(vehicle.getModelo())
                .setActivo(vehicle.isActivo())
                .setPrecioDiario(vehicle.getPrecioDiario())
                .setAnio(vehicle.getAnio())
                .setColor(vehicle.getColor() == null ? "" : vehicle.getColor())
                .setEstado(VehicleStatus.valueOf(vehicle.getEstado().name()))
                .setTipo(VehicleType.valueOf(vehicle.getTipo().name()))
                .build();
    }

    private <T> void respond(
            StreamObserver<T> responseObserver,
            Supplier<T> operation) {

        T response;

        try {
            response = operation.get();
        } catch (StatusRuntimeException exception) {
            responseObserver.onError(exception);
            return;
        } catch (Exception exception) {
            log.error("Error al procesar la solicitud de crear vehiculo", exception);

            responseObserver.onError(
                    Status.INTERNAL
                            .withDescription("No se pudo procesar la solicitud de crear vehiculo")
                            .asRuntimeException());
            return;
        }

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }
}
