import { Args, Query, Resolver } from '@nestjs/graphql';
import { VehiculosService } from '../../vehiculos/vehiculos.service';
import {
  VehiculoDisponible,
  VehiculosDisponiblesInput,
} from './vehiculos-disponibles.types';

@Resolver(() => VehiculoDisponible)
export class VehiculosResolver {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Query(() => [VehiculoDisponible], {
    name: 'vehiculosDisponibles',
    description:
      'Busca vehículos activos sin reservas superpuestas en el período solicitado.',
  })
  vehiculosDisponibles(
    @Args('filtros') filtros: VehiculosDisponiblesInput,
  ): Promise<VehiculoDisponible[]> {
    return this.vehiculosService.buscarDisponibles(filtros);
  }
}
