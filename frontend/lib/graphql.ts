import { gql } from "@apollo/client";

export const QUERY_VEHICULOS_DISPONIBLES = gql`
  query VehiculosDisponibles($filtros: FiltrosVehiculosDisponiblesInput!) {
    vehiculosDisponibles(filtros: $filtros) {
      id
      patente
      marca
      modelo
      anio
      color
      tipo
      precioDiario
      estado
      activo
    }
  }
`;

export const QUERY_RESERVAS = gql`
  query Reservas($filtros: ReservasInput) {
    reservas(filtros: $filtros) {
      id
      fechaInicio
      fechaFin
      precioDiario
      importeTotal
      estado
      cliente {
        id
        nombre
        apellido
      }
      vehiculo {
        id
        patente
        marca
        modelo
        tipo
      }
    }
  }
`;

export const QUERY_HISTORIAL_CLIENTE = gql`
  query HistorialCliente {
    historialCliente {
      id
      fechaInicio
      fechaFin
      cantidadDias
      importeTotal
      estado
      vehiculo {
        id
        patente
        marca
        modelo
        tipo
      }
    }
  }
`;