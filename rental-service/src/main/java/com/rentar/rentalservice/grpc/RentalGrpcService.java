package com.rentar.rentalservice.grpc;

import com.rentar.rentalservice.entity.RentalStatus;
import com.rentar.rentalservice.entity.Rental;
import com.rentar.rentalservice.service.RentalService;

import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import io.grpc.stub.StreamObserver;

import net.devh.boot.grpc.server.service.GrpcService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.function.Supplier;

@GrpcService
public class RentalGrpcService extends RentalServiceGrpc.RentalServiceImplBase {

    private static final Logger log = LoggerFactory.getLogger(RentalGrpcService.class);

    private final RentalService rentalService;

    public RentalGrpcService(RentalService rentalService) {
        this.rentalService = rentalService;
    }

    @Override
    public void createRental(
            CreateRentalRequest request,
            StreamObserver<RentalResponse> responseObserver) {

        respond(responseObserver, () -> toResponse(rentalService.create(request)));
    }

    @Override
    public void getRentals(
            GetRentalsRequest request,
            StreamObserver<GetRentalsResponse> responseObserver) {

        respond(responseObserver, () -> {
            GetRentalsResponse.Builder builder = GetRentalsResponse.newBuilder();

            List<Rental> rentals = rentalService.getAll(
                    request.getCustomerId(),
                    request.getVehicleId()
            );

            for (Rental rental : rentals) {
                builder.addRentals(toResponse(rental));
            }

            return builder.build();
        });
    }

    @Override
    public void cancelRental(
            CancelRentalRequest request,
            StreamObserver<RentalResponse> responseObserver) {

        respond(responseObserver, () -> toResponse(rentalService.cancel(request)));
    }

    @Override
    public void getRentalHistory(
            GetRentalHistoryRequest request,
            StreamObserver<GetRentalsResponse> responseObserver) {

        respond(responseObserver, () -> {
            GetRentalsResponse.Builder builder = GetRentalsResponse.newBuilder();

            List<Rental> history = rentalService.getHistory(request.getCustomerId());

            for (Rental rental : history) {
                builder.addRentals(toResponse(rental));
            }

            return builder.build();
        });
    }

    private RentalResponse toResponse(Rental rental) {
        return RentalResponse.newBuilder()
                .setId(rental.getId())
                .setCustomerId(rental.getCustomerId())
                .setVehicleId(rental.getVehicleId())
                .setFechaInicio(safeString(rental.getFechaInicio() != null ? rental.getFechaInicio().toString() : ""))
                .setFechaFin(safeString(rental.getFechaFin() != null ? rental.getFechaFin().toString() : ""))
                .setPrecioDiario(rental.getPrecioDiario() != null ? rental.getPrecioDiario() : 0.0)
                .setImporteTotal(rental.getImporteTotal() != null ? rental.getImporteTotal() : 0.0)
                .setEstado(mapStatusToProto(rental.getEstado()))
                .build();
    }

    private com.rentar.rentalservice.grpc.RentalStatus mapStatusToProto(RentalStatus status) {
        if (status == null) {
            return com.rentar.rentalservice.grpc.RentalStatus.RENTAL_STATUS_UNSPECIFIED;
        }

        return switch (status) {
            case CONFIRMADA -> com.rentar.rentalservice.grpc.RentalStatus.CONFIRMADA;
            case EN_CURSO -> com.rentar.rentalservice.grpc.RentalStatus.EN_CURSO;
            case FINALIZADA -> com.rentar.rentalservice.grpc.RentalStatus.FINALIZADA;
            case CANCELADA -> com.rentar.rentalservice.grpc.RentalStatus.CANCELADA;
        };
    }

    private String safeString(String value) {
        return value == null ? "" : value;
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
            log.error("Error al procesar la solicitud de alquiler/reserva", exception);

            responseObserver.onError(
                    Status.INTERNAL
                            .withDescription("No se pudo procesar la solicitud de reserva")
                            .asRuntimeException());
            return;
        }

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }
}