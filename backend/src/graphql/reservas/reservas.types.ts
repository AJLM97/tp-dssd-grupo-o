import {
  Field,
  Float,
  GraphQLISODateTime,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { EstadoReserva } from '../../enums/estado-reserva.enum';
import { TipoVehiculo } from '../../enums/tipo-vehiculo.enum';

registerEnumType(EstadoReserva, {
  name: 'EstadoReserva',
  description: 'Estado actual de una reserva.',
});

@InputType({
  description:
    'Filtros opcionales para consultar reservas. Se combinan entre sí.',
})
export class ReservasInput {
  @Field(() => Int, {
    nullable: true,
    description:
      'Filtra por cliente. Un CLIENTE solo puede indicar su propio id; indicar otro devuelve FORBIDDEN.',
  })
  clienteId?: number;

  @Field(() => Int, { nullable: true, description: 'Filtra por vehículo.' })
  vehiculoId?: number;

  @Field(() => TipoVehiculo, {
    nullable: true,
    description: 'Filtra por la categoría del vehículo reservado.',
  })
  tipoVehiculo?: TipoVehiculo;

  @Field(() => EstadoReserva, {
    nullable: true,
    description: 'Filtra por el estado de la reserva.',
  })
  estado?: EstadoReserva;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description:
      'Inicio del rango de fechas. Requiere fechaFin. Devuelve las reservas cuyo período se superpone con el rango.',
  })
  fechaInicio?: Date;

  @Field(() => GraphQLISODateTime, {
    nullable: true,
    description:
      'Fin del rango de fechas. Requiere fechaInicio y debe ser posterior a esta.',
  })
  fechaFin?: Date;
}

@ObjectType({ description: 'Datos básicos del cliente que hizo la reserva.' })
export class ClienteReserva {
  @Field(() => Int, { description: 'Identificador del cliente.' })
  id: number;

  @Field({ description: 'Nombre del cliente.' })
  nombre: string;

  @Field({ description: 'Apellido del cliente.' })
  apellido: string;
}

@ObjectType({ description: 'Datos básicos del vehículo reservado.' })
export class VehiculoReserva {
  @Field(() => Int, { description: 'Identificador del vehículo.' })
  id: number;

  @Field({ description: 'Patente del vehículo.' })
  patente: string;

  @Field({ description: 'Marca del vehículo.' })
  marca: string;

  @Field({ description: 'Modelo del vehículo.' })
  modelo: string;

  @Field(() => TipoVehiculo, { description: 'Categoría del vehículo.' })
  tipo: TipoVehiculo;
}

@ObjectType({ description: 'Reserva con su cliente y su vehículo.' })
export class ReservaResultado {
  @Field(() => Int, { description: 'Identificador de la reserva.' })
  id: number;

  @Field(() => ClienteReserva, { description: 'Cliente que hizo la reserva.' })
  cliente: ClienteReserva;

  @Field(() => VehiculoReserva, { description: 'Vehículo reservado.' })
  vehiculo: VehiculoReserva;

  @Field(() => GraphQLISODateTime, { description: 'Inicio del alquiler.' })
  fechaInicio: Date;

  @Field(() => GraphQLISODateTime, { description: 'Fin del alquiler.' })
  fechaFin: Date;

  @Field(() => Float, {
    description: 'Precio diario registrado en la reserva.',
  })
  precioDiario: number;

  @Field(() => Float, { description: 'Importe total del alquiler.' })
  importeTotal: number;

  @Field(() => EstadoReserva, { description: 'Estado de la reserva.' })
  estado: EstadoReserva;
}

@ObjectType({
  description:
    'Alquiler finalizado o reserva cancelada del cliente que consulta.',
})
export class HistorialClienteResultado {
  @Field(() => Int, { description: 'Identificador de la reserva.' })
  id: number;

  @Field(() => VehiculoReserva, { description: 'Vehículo alquilado.' })
  vehiculo: VehiculoReserva;

  @Field(() => GraphQLISODateTime, { description: 'Inicio del alquiler.' })
  fechaInicio: Date;

  @Field(() => GraphQLISODateTime, { description: 'Fin del alquiler.' })
  fechaFin: Date;

  @Field(() => Int, {
    description:
      'Días de alquiler, redondeados hacia arriba con un mínimo de 1. Se calcula al consultar.',
  })
  cantidadDias: number;

  @Field(() => Float, { description: 'Importe total del alquiler.' })
  importeTotal: number;

  @Field(() => EstadoReserva, {
    description:
      'FINALIZADA o CANCELADA. Una reserva CONFIRMADA o EN_CURSO cuyo período ya terminó se informa como FINALIZADA.',
  })
  estado: EstadoReserva;
}
