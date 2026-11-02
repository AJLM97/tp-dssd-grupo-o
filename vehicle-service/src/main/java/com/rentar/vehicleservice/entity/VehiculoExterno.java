package com.rentar.vehicleservice.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

// Solicitud de un cliente para sumar su vehiculo. Recien se crea el Vehicle cuando las dos validaciones dan VALIDADO
@Entity
@Table(name = "vehiculos_externos")
@Getter
@Setter
public class VehiculoExterno {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long clienteId;

    @Column(nullable = false)
    private String patente;

    @Column(nullable = false)
    private String marca;

    @Column(nullable = false)
    private String modelo;

    @Column(nullable = false)
    private Integer anio;

    private String color;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoVehiculo tipo;

    @Column(nullable = false)
    private Double precioDiario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoSolicitudExterna estado = EstadoSolicitudExterna.PENDIENTE;

    // Quedan en null hasta que llega la respuesta de cada validacion
    @Enumerated(EnumType.STRING)
    private ResultadoValidacion resultadoPatente;

    @Enumerated(EnumType.STRING)
    private ResultadoValidacion resultadoTitularidad;

    // Vehiculo creado al incorporarse; null mientras no se incorpora
    private Long vehicleId;
}
