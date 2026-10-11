package com.rentar.vehicleservice.grpc;

import com.rentar.vehicleservice.entity.Vehicle;
import io.grpc.StatusRuntimeException;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import com.rentar.vehicleservice.service.VehicleService;

@GrpcService
public class VehicleGrpcService extends VehicleServiceGrpc.VehicleServiceImplBase {

    private final VehicleService vehicleService;

    public VehicleGrpcService(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
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
}
