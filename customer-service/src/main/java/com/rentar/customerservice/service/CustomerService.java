package com.rentar.customerservice.service;

import com.rentar.customerservice.entity.Customer;
import com.rentar.customerservice.grpc.CreateCustomerRequest;
import com.rentar.customerservice.grpc.UpdateCustomerRequest;
import com.rentar.customerservice.repository.CustomerRepository;

import io.grpc.Status;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
@Transactional
public class CustomerService {

    private final CustomerRepository repository;
    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    public CustomerService(CustomerRepository repository) {
        this.repository = repository;
    }

    public Customer create(CreateCustomerRequest request) {
        String documento = required(request.getDocumento(), "documento");
        String nombre = required(request.getNombre(), "nombre");
        String apellido = required(request.getApellido(), "apellido");
        String email = validateEmail(request.getEmail());
        String password = request.getPassword();

        if (password.isBlank()) {
            throw invalid("La contraseña es obligatoria");
        }

        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw invalid("La contraseña supera el límite de 72 bytes");
        }

        LocalDate fechaNacimiento = parseDate(request.getFechaNacimiento());

        if (repository.existsByDocumento(documento)) {
            throw Status.ALREADY_EXISTS
                    .withDescription("Ya existe un cliente con ese documento")
                    .asRuntimeException();
        }

        if (repository.existsByEmail(email)) {
            throw Status.ALREADY_EXISTS
                    .withDescription("Ya existe un cliente con ese email")
                    .asRuntimeException();
        }

        Customer customer = new Customer();
        customer.setDocumento(documento);
        customer.setNombre(nombre);
        customer.setApellido(apellido);
        customer.setEmail(email);
        customer.setPassword(passwordEncoder.encode(password));
        customer.setTelefono(request.getTelefono().trim());
        customer.setFechaNacimiento(fechaNacimiento);
        customer.setActivo(true);

        return repository.saveAndFlush(customer);
    }

    public Customer update(UpdateCustomerRequest request) {
        Customer customer = getById(request.getId());

        String nombre = required(request.getNombre(), "nombre");
        String apellido = required(request.getApellido(), "apellido");
        String email = validateEmail(request.getEmail());
        LocalDate fechaNacimiento = parseDate(request.getFechaNacimiento());

        if (repository.existsByEmailAndIdNot(email, customer.getId())) {
            throw Status.ALREADY_EXISTS
                    .withDescription("Ya existe otro cliente con ese email")
                    .asRuntimeException();
        }

        customer.setNombre(nombre);
        customer.setApellido(apellido);
        customer.setEmail(email);
        customer.setTelefono(request.getTelefono().trim());
        customer.setFechaNacimiento(fechaNacimiento);

        return repository.saveAndFlush(customer);
    }

    public Customer delete(long id) {
        Customer customer = getById(id);
        customer.setActivo(false);
        return repository.saveAndFlush(customer);
    }

    @Transactional(readOnly = true)
    public Customer getById(long id) {
        validateId(id);

        return repository.findById(id)
                .orElseThrow(() -> Status.NOT_FOUND
                        .withDescription("No existe un cliente con ese ID")
                        .asRuntimeException());
    }

    @Transactional(readOnly = true)
    public List<Customer> getAll(boolean soloActivos) {
        return soloActivos
                ? repository.findByActivoTrue()
                : repository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Customer> findForValidation(long id) {
        validateId(id);
        return repository.findById(id);
    }

    private void validateId(long id) {
        if (id <= 0) {
            throw invalid("El ID debe ser mayor que cero");
        }
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

    private String validateEmail(String value) {
        String email = required(value, "email")
                .toLowerCase(Locale.ROOT);

        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw invalid("El email no tiene un formato válido");
        }

        return email;
    }

    private LocalDate parseDate(String value) {
        if (value.isBlank()) {
            return null;
        }

        try {
            LocalDate date = LocalDate.parse(value.trim());

            if (date.isAfter(LocalDate.now())) {
                throw invalid("La fecha de nacimiento no puede ser futura");
            }

            return date;
        } catch (DateTimeParseException exception) {
            throw invalid("La fecha debe tener el formato AAAA-MM-DD");
        }
    }

    private RuntimeException invalid(String message) {
        return Status.INVALID_ARGUMENT
                .withDescription(message)
                .asRuntimeException();
    }
}