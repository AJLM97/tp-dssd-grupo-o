package com.rentar.vehicleservice.entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;


@Entity
@Table(name = "vehicles")
@Getter
@Setter
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String patente;

    @Column(nullable = false)
    private String marca;

    @Column(nullable = false)
    private  String modelo;

    @Column(nullable = false)
    private  Integer anio;


    private  String color;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoVehiculo tipo;



    @Column(nullable = false)
    private Double precioDiario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private  EstadoVehiculo estado = EstadoVehiculo.DISPONIBLE;

    @Column(nullable = false)
    private  boolean activo = true;

    // Resultado de la verificacion policial: no es un estado operativo. Los vehiculos previos al Hito 3 quedan en null
    @Enumerated(EnumType.STRING)
    private VerificacionVehiculo verificacion = VerificacionVehiculo.PENDIENTE;


}