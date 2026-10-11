package com.rentar.rentalservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reservas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Rental {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "vehicle_id", nullable = false)
    private Long vehicleId;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDateTime fechaFin;

    @Column(name = "precio_diario", nullable = false)
    private Double precioDiario;

    @Column(name = "importe_total", nullable = false)
    private Double importeTotal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RentalStatus estado;
}