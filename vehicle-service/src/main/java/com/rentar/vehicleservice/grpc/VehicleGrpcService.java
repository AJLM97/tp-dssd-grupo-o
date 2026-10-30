package com.rentar.vehicleservice.grpc;

import com.rentar.vehicleservice.entity.EstadoVehiculo;
import com.rentar.vehicleservice.entity.TipoVehiculo;
import com.rentar.vehicleservice.entity.Vehicle;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import com.rentar.vehicleservice.service.VehicleService;

import java.util.Optional;

@GrpcService
public class VehicleGrpcService extends VehicleServiceGrpc.VehicleServiceImplBase {

    private final VehicleService vehicleService;

    public VehicleGrpcService(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @Override
    public void createVehicle(CreateVehicleRequest request, StreamObserver<CreateVehicleResponse> responseObserver) {

        try {
            Vehicle vehicle = new Vehicle();
            vehicle.setPatente(request.getPatente().trim());
            vehicle.setMarca(request.getMarca().trim());
            vehicle.setModelo(request.getModelo().trim());
            vehicle.setAnio(request.getAnio());
            vehicle.setColor(request.getColor().isBlank() ? null : request.getColor().trim());
            vehicle.setTipo(toTipo(request.getTipo()));
            vehicle.setPrecioDiario(request.getPrecioDiario());

            Vehicle creado = vehicleService.create(vehicle);
            responseObserver.onNext(CreateVehicleResponse.newBuilder()
                    .setVehicle(toVehicleData(creado))
                    .build());
            responseObserver.onCompleted();
        } catch (StatusRuntimeException e) {
            responseObserver.onError(e);
        }
    }

    @Override
    public void updateVehicle(UpdateVehicleRequest request, StreamObserver<UpdateVehicleResponse> responseObserver) {

        try {
            Vehicle datos = new Vehicle();
            datos.setMarca(request.getMarca().trim());
            datos.setModelo(request.getModelo().trim());
            datos.setAnio(request.getAnio());
            datos.setColor(request.getColor().isBlank() ? null : request.getColor().trim());
            datos.setTipo(toTipo(request.getTipo()));
            datos.setPrecioDiario(request.getPrecioDiario());

            Vehicle actualizado = vehicleService.update(request.getId(), datos);
            responseObserver.onNext(UpdateVehicleResponse.newBuilder()
                    .setVehicle(toVehicleData(actualizado))
                    .build());
            responseObserver.onCompleted();
        } catch (StatusRuntimeException e) {
            responseObserver.onError(e);
        }
    }

    @Override
    public void deleteVehicle(DeleteVehicleRequest request, StreamObserver<DeleteVehicleResponse> responseObserver) {

        try {
            Vehicle vehicle = vehicleService.delete(request.getId());
            responseObserver.onNext(DeleteVehicleResponse.newBuilder()
                    .setVehicle(toVehicleData(vehicle))
                    .build());
            responseObserver.onCompleted();
        } catch (StatusRuntimeException e) {
            responseObserver.onError(e);
        }
    }

    @Override
    public void getVehicleById(GetVehicleByIdRequest request, StreamObserver<GetVehicleByIdResponse> responseObserver) {

        try {
            Vehicle vehicle = vehicleService.getById(request.getId());
            responseObserver.onNext(GetVehicleByIdResponse.newBuilder()
                    .setVehicle(toVehicleData(vehicle))
                    .build());
            responseObserver.onCompleted();
        } catch (StatusRuntimeException e) {
            responseObserver.onError(e);
        }
    }

    @Override
    public void getVehicles(GetVehiclesRequest request, StreamObserver<GetVehiclesResponse> responseObserver) {
        GetVehiclesResponse.Builder response = GetVehiclesResponse.newBuilder();

        for (Vehicle vehicle : vehicleService.getAll(request.getSoloActivos())) {
            response.addVehicles(toVehicleData(vehicle));
        }

        responseObserver.onNext(response.build());
        responseObserver.onCompleted();
    }

    @Override
    public void updateVehicleStatus(UpdateVehicleStatusRequest request, StreamObserver<UpdateVehicleStatusResponse> responseObserver) {

        try {
            if (request.getNuevoEstado() == VehicleStatus.VEHICLE_STATUS_UNSPECIFIED || request.getNuevoEstado() == VehicleStatus.UNRECOGNIZED) {
                throw Status.INVALID_ARGUMENT.withDescription("El nuevo estado no es valido!").asRuntimeException();
            }
            EstadoVehiculo nuevoEstado = EstadoVehiculo.valueOf(
                    request.getNuevoEstado().name().substring("VEHICLE_STATUS_".length()));
            Vehicle vehicle = vehicleService.updateStatus(request.getId(), nuevoEstado);
            responseObserver.onNext(UpdateVehicleStatusResponse.newBuilder()
                    .setVehicle(toVehicleData(vehicle))
                    .build());
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

    private VehicleData toVehicleData(Vehicle vehicle) {
        return VehicleData.newBuilder()
                .setId(vehicle.getId())
                .setPatente(vehicle.getPatente())
                .setMarca(vehicle.getMarca())
                .setModelo(vehicle.getModelo())
                .setActivo(vehicle.isActivo())
                .setPrecioDiario(vehicle.getPrecioDiario())
                .setAnio(vehicle.getAnio())
                .setColor(vehicle.getColor() == null ? "" : vehicle.getColor())
                .setEstado(VehicleStatus.valueOf(
                        "VEHICLE_STATUS_" + vehicle.getEstado().name()))
                .setTipo(VehicleType.valueOf(
                        "VEHICLE_TYPE_" + vehicle.getTipo().name()))
                .build();
    }

    private TipoVehiculo toTipo(VehicleType tipo) {
        if (tipo == VehicleType.VEHICLE_TYPE_UNSPECIFIED || tipo == VehicleType.UNRECOGNIZED) {
            throw Status.INVALID_ARGUMENT.withDescription("El tipo de vehiculo no es valido!").asRuntimeException();
        }
        return TipoVehiculo.valueOf(
                tipo.name().substring("VEHICLE_TYPE_".length()));
    }
}
