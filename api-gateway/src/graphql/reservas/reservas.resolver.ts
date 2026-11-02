import { BadRequestException, ForbiddenException, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ReservasService } from '../../reservas/reservas.service';
import {
  CrearReservaInput,
  HistorialClienteResultado,
  ReservaCreadaResultado,
  ReservaResultado,
  ReservasInput,
} from './reservas.types';
import { GqlAuthGuard } from '../../auth/gql-auth.guard';
import { UsuarioActualGql } from '../../auth/usuario-actual-gql.decorator';
import { ClientesService } from '../../clientes/clientes.service';
import { EstadoReserva } from '../../enums/estado-reserva.enum';
import { EstadoMantenimiento } from '../../enums/estado-mantenimiento.enum';

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

function convertirEstadoMantenimiento(
  estado: EstadoMantenimiento | number | string,
): EstadoMantenimiento {
  if (
    typeof estado === 'string' &&
    Object.values(EstadoMantenimiento).includes(estado as EstadoMantenimiento)
  ) {
    return estado as EstadoMantenimiento;
  }

  const estados: Record<number, EstadoMantenimiento> = {
    1: EstadoMantenimiento.PENDIENTE,
    2: EstadoMantenimiento.REALIZADO,
    3: EstadoMantenimiento.NO_REALIZADO,
  };

  const convertido = estados[Number(estado)];
  if (!convertido) {
    throw new Error(`Estado de mantenimiento gRPC desconocido: ${estado}`);
  }
  return convertido;
}

@Resolver(() => ReservaResultado)
export class ReservasResolver {
  constructor(private readonly reservasService: ReservasService, private readonly clientesService: ClientesService) { }

  @Mutation(() => ReservaCreadaResultado, {
    name: 'crearReserva',
    description:
      'Crea una reserva y devuelve su confirmación sin esperar el mantenimiento preventivo.',
  })
  @UseGuards(GqlAuthGuard)
  async crearReserva(
    @Args('input') input: CrearReservaInput,
    @UsuarioActualGql() usuarioActual: any,
  ): Promise<ReservaCreadaResultado> {
    let clienteId: number;

    if (usuarioActual.rol === 'CLIENTE') {
      clienteId = Number(usuarioActual.clienteId || usuarioActual.userId);
      if (input.clienteId && Number(input.clienteId) !== clienteId) {
        throw new ForbiddenException('No podés crear una reserva para otro cliente.');
      }
    } else if (usuarioActual.rol === 'ADMIN') {
      if (!input.clienteId || input.clienteId <= 0) {
        throw new BadRequestException('El cliente es obligatorio para crear una reserva como administrador.');
      }
      clienteId = input.clienteId;
    } else {
      throw new ForbiddenException('El usuario no tiene permisos para crear reservas.');
    }

    const rental = await this.reservasService.crearReserva({
      clienteId,
      vehiculoId: input.vehiculoId,
      fechaInicio: input.fechaInicio,
      fechaFin: input.fechaFin,
    });

    return {
      id: Number(rental.id),
      clienteId: Number(rental.customerId ?? rental.customer_id),
      vehiculoId: Number(rental.vehicleId ?? rental.vehicle_id),
      fechaInicio: new Date(rental.fechaInicio ?? rental.fecha_inicio),
      fechaFin: new Date(rental.fechaFin ?? rental.fecha_fin),
      importeTotal: Number(rental.importeTotal ?? rental.importe_total),
      estado: convertirEstadoReserva(rental.estado),
      mantenimientoEstado: convertirEstadoMantenimiento(rental.mantenimientoEstado),
    };
  }

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
      mantenimientoEstado: convertirEstadoMantenimiento(r.mantenimientoEstado),
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
      mantenimientoEstado: convertirEstadoMantenimiento(r.mantenimientoEstado),
    };
  }
}