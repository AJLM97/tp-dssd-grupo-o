package com.rentar.customerservice.repository;

import com.rentar.customerservice.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    boolean existsByDocumento(String documento);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    List<Customer> findByActivoTrue();
}