package com.rentar.customerservice.grpc;

import com.rentar.customerservice.entity.Customer;
import com.rentar.customerservice.service.CustomerService;

import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import io.grpc.stub.StreamObserver;

import net.devh.boot.grpc.server.service.GrpcService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;
import java.util.function.Supplier;

@GrpcService
public class CustomerGrpcService
        extends CustomerServiceGrpc.CustomerServiceImplBase {

    private static final Logger log =
            LoggerFactory.getLogger(CustomerGrpcService.class);

    private final CustomerService customerService;

    public CustomerGrpcService(CustomerService customerService) {
        this.customerService = customerService;
    }

    @Override
    public void createCustomer(
            CreateCustomerRequest request,
            StreamObserver<CustomerResponse> responseObserver) {

        respond(responseObserver,
                () -> toResponse(customerService.create(request)));
    }

    @Override
    public void updateCustomer(
            UpdateCustomerRequest request,
            StreamObserver<CustomerResponse> responseObserver) {

        respond(responseObserver,
                () -> toResponse(customerService.update(request)));
    }

    @Override
    public void deleteCustomer(
            DeleteCustomerRequest request,
            StreamObserver<CustomerResponse> responseObserver) {

        respond(responseObserver,
                () -> toResponse(
                        customerService.delete(request.getId())));
    }

    @Override
    public void getCustomers(
            GetCustomersRequest request,
            StreamObserver<GetCustomersResponse> responseObserver) {

        respond(responseObserver, () -> {
            GetCustomersResponse.Builder response =
                    GetCustomersResponse.newBuilder();

            for (Customer customer :
                    customerService.getAll(request.getSoloActivos())) {
                response.addCustomers(toResponse(customer));
            }

            return response.build();
        });
    }

    @Override
    public void getCustomerById(
            GetCustomerByIdRequest request,
            StreamObserver<CustomerResponse> responseObserver) {

        respond(responseObserver,
                () -> toResponse(
                        customerService.getById(request.getId())));
    }

    @Override
    public void validateCustomer(
            ValidateCustomerRequest request,
            StreamObserver<ValidateCustomerResponse> responseObserver) {

        respond(responseObserver, () -> {
            Optional<Customer> customer =
                    customerService.findForValidation(request.getId());

            if (customer.isEmpty()) {
                return ValidateCustomerResponse.newBuilder()
                        .setValido(false)
                        .setActivo(false)
                        .setMensaje("El cliente no existe")
                        .build();
            }

            boolean activo = customer.get().isActivo();

            return ValidateCustomerResponse.newBuilder()
                    .setValido(activo)
                    .setActivo(activo)
                    .setMensaje(activo
                            ? "Cliente válido y activo"
                            : "El cliente está inactivo")
                    .build();
        });
    }

    private CustomerResponse toResponse(Customer customer) {
        return CustomerResponse.newBuilder()
                .setId(customer.getId())
                .setDocumento(safeString(customer.getDocumento()))
                .setNombre(safeString(customer.getNombre()))
                .setApellido(safeString(customer.getApellido()))
                .setEmail(safeString(customer.getEmail()))
                .setTelefono(safeString(customer.getTelefono()))
                .setFechaNacimiento(
                        customer.getFechaNacimiento() == null
                                ? ""
                                : customer.getFechaNacimiento().toString())
                .setActivo(customer.isActivo())
                .build();
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
            log.error("Error al procesar una solicitud de clientes",
                    exception);

            responseObserver.onError(
                    Status.INTERNAL
                            .withDescription(
                                    "No se pudo procesar la solicitud")
                            .asRuntimeException());
            return;
        }

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }
}