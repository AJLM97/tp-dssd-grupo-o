import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { ReservasService } from '../../reservas/reservas.service';
import {
  HistorialClienteResultado,
  ReservaResultado,
  ReservasInput,
} from './reservas.types';
import { GqlAuthGuard } from '../../auth/gql-auth.guard';
import { UsuarioActualGql } from '../../auth/usuario-actual-gql.decorator';
import { ClientesService } from '../../clientes/clientes.service';
import { EstadoReserva } from '../../enums/estado-reserva.enum';

function convertirEstadoReserva(estado: number | string): EstadoReserva {
  if (
    typeof estado === 'string' &&
    Object.values(EstadoReserva).includes(estado as EstadoReserva)
  ) {
    return estado as EstadoReserva;
  }

  const estados: Record<number, EstadoReserva> = {
    1: EstadoReserva.CONFIRMADA,
    2: EstadoReserva.EN_CURSO,
    3: EstadoReserva.FINALIZADA,
    4: EstadoReserva.CANCELADA,
  };

  const convertido = estados[Number(estado)];

  if (!convertido) {
    throw new Error(`Estado de reserva gRPC desconocido: ${estado}`);
  }

  return convertido;
}

@Resolver(() => ReservaResultado)
export class ReservasResolver {
  constructor(private readonly reservasService: ReservasService, private readonly clientesService: ClientesService) { }

  @Query(() => [ReservaResultado], {
    name: 'reservas',
    description:
      'Consulta reservas aplicando filtros a través de gRPC con Rental Service.',
  })
  @UseGuards(GqlAuthGuard)
  async reservas(
    @Args('filtros', { type: () => ReservasInput, nullable: true })
    filtros?: ReservasInput,
  ): Promise<ReservaResultado[]> {
    const lista = await this.reservasService.buscar(filtros ?? {});
    return Promise.all(
      lista.map(async (r: any) => {
        const clienteId = Number(r.customerId ?? r.customer_id);
        const cliente = await this.clientesService.obtenerPorId(clienteId);

        return this.mapToGqlResultado(r, cliente);
      }),
    );
  }

  @Query(() => [HistorialClienteResultado], {
    name: 'historialCliente',
    description:
      'Devuelve los alquileres finalizados y cancelados del cliente autenticado vía gRPC.',
  })
  @UseGuards(GqlAuthGuard)
  async historialCliente(
    @UsuarioActualGql() usuarioActual: any,
  ): Promise<HistorialClienteResultado[]> {
    const clienteId = usuarioActual.clienteId || usuarioActual.userId;
    const historial = await this.reservasService.buscarHistorialCliente(clienteId);

    return historial.map((r: any) => ({
      id: Number(r.id),
      vehiculo: {
        id: Number(r.vehicleId || r.vehicle_id),
        patente: r.vehiculo?.patente || '',
        marca: r.vehiculo?.marca || '',
        modelo: r.vehiculo?.modelo || '',
        tipo: r.vehiculo?.tipo ?? null,
      },
      fechaInicio: new Date(r.fechaInicio || r.fecha_inicio),
      fechaFin: new Date(r.fechaFin || r.fecha_fin),
      cantidadDias: Number(r.cantidadDias || 1),
      importeTotal: Number(r.importeTotal || r.importe_total || 0),
      estado: convertirEstadoReserva(r.estado),
    }));
  }

  private mapToGqlResultado(r: any, cliente: any): ReservaResultado {
    return {
      id: Number(r.id),
      cliente: {
        id: Number(cliente.id),
        nombre: cliente.nombre,
        apellido: cliente.apellido,
      },
      vehiculo: {
        id: Number(r.vehicleId || r.vehicle_id),
        patente: r.vehiculo?.patente || '',
        marca: r.vehiculo?.marca || '',
        modelo: r.vehiculo?.modelo || '',
        tipo: r.vehiculo?.tipo || 'SEDAN',
      },
      fechaInicio: new Date(r.fechaInicio || r.fecha_inicio),
      fechaFin: new Date(r.fechaFin || r.fecha_fin),
      precioDiario: Number(r.precioDiario || r.precio_diario || 0),
      importeTotal: Number(r.importeTotal || r.importe_total || 0),
      estado: convertirEstadoReserva(r.estado),
    };
  }
}