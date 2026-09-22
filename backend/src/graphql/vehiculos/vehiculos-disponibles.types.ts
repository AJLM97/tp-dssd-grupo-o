import {
  Field,
  Float,
  GraphQLISODateTime,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { TipoVehiculo } from '../../enums/tipo-vehiculo.enum';

registerEnumType(TipoVehiculo, {
  name: 'TipoVehiculo',
  description: 'Categoría del vehículo.',
});

@InputType({
  description:
    'Período obligatorio y filtros opcionales para buscar vehículos disponibles.',
})
export class VehiculosDisponiblesInput {
  @Field(() => GraphQLISODateTime, {
    description: 'Fecha y hora desde la que se solicita el vehículo.',
  })
  fechaInicio: Date;

  @Field(() => GraphQLISODateTime, {
    description: 'Fecha y hora hasta la que se solicita el vehículo.',
  })
  fechaFin: Date;

  @Field(() => TipoVehiculo, {
    nullable: true,
    description: 'Categoría exacta del vehículo.',
  })
  tipo?: TipoVehiculo;

  @Field({
    nullable: true,
    description: 'Marca. Coincidencia parcial, sin distinguir mayúsculas.',
  })
  marca?: string;

  @Field({
    nullable: true,
    description: 'Modelo. Coincidencia parcial, sin distinguir mayúsculas.',
  })
  modelo?: string;

  @Field(() => Float, {
    nullable: true,
    description: 'Precio diario mínimo (inclusivo). No puede ser negativo.',
  })
  precioDiarioMin?: number;

  @Field(() => Float, {
    nullable: true,
    description:
      'Precio diario máximo (inclusivo). No puede ser negativo ni menor al mínimo.',
  })
  precioDiarioMax?: number;
}

@ObjectType({
  description: 'Vehículo activo y libre durante todo el período consultado.',
})
export class VehiculoDisponible {
  @Field(() => Int, {
    description: 'Identificador del vehículo; se usa para crear la reserva.',
  })
  id: number;

  @Field({ description: 'Patente única del vehículo.' })
  patente: string;

  @Field({ description: 'Marca del vehículo.' })
  marca: string;

  @Field({ description: 'Modelo del vehículo.' })
  modelo: string;

  @Field(() => Int, { description: 'Año de fabricación.' })
  anio: number;

  @Field({ nullable: true, description: 'Color del vehículo, si se informó.' })
  color?: string;

  @Field(() => TipoVehiculo, { description: 'Categoría del vehículo.' })
  tipo: TipoVehiculo;

  @Field(() => Float, { description: 'Precio de alquiler por día.' })
  precioDiario: number;
}
