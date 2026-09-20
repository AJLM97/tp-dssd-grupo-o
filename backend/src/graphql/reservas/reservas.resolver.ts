import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import {
  IdentidadTemporalGuard,
  UsuarioActual,
} from '../../auth/identidad-temporal.graphql';
import { Usuario } from '../../entities/usuario.entity';
import { ReservasService } from '../../reservas/reservas.service';
import {
  HistorialClienteResultado,
  ReservaResultado,
  ReservasInput,
} from './reservas.types';

@Resolver(() => ReservaResultado)
export class ReservasResolver {
  constructor(private readonly reservasService: ReservasService) {}

  @Query(() => [ReservaResultado], {
    name: 'reservas',
    description:
      'Consulta reservas aplicando filtros y el acceso del usuario actual.',
  })
  @UseGuards(IdentidadTemporalGuard)
  reservas(
    @UsuarioActual() usuarioActual: Usuario,
    @Args('filtros', { type: () => ReservasInput, nullable: true })
    filtros?: ReservasInput,
  ): Promise<ReservaResultado[]> {
    return this.reservasService.buscar(filtros ?? {}, usuarioActual);
  }

  @Query(() => [HistorialClienteResultado], {
    name: 'historialCliente',
    description:
      'Devuelve los alquileres finalizados y las reservas canceladas del cliente actual.',
  })
  @UseGuards(IdentidadTemporalGuard)
  historialCliente(
    @UsuarioActual() usuarioActual: Usuario,
  ): Promise<HistorialClienteResultado[]> {
    return this.reservasService.buscarHistorialCliente(usuarioActual);
  }
}
