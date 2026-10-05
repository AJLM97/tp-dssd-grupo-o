import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reserva } from '../entities/reserva.entity';
import { Usuario } from '../entities/usuario.entity';
import { Vehiculo } from '../entities/vehiculo.entity';
import { EstadoReserva } from '../enums/estado-reserva.enum';
import { RolUsuario } from '../enums/rol-usuario.enum';
import { TipoVehiculo } from '../enums/tipo-vehiculo.enum';
import { Cliente } from '../entities/cliente.entity';

export interface FiltrosReservas {
  clienteId?: number;
  vehiculoId?: number;
  tipoVehiculo?: TipoVehiculo;
  estado?: EstadoReserva;
  fechaInicio?: Date;
  fechaFin?: Date;
}

export interface HistorialClienteItem {
  id: number;
  vehiculo: Vehiculo;
  fechaInicio: Date;
  fechaFin: Date;
  cantidadDias: number;
  importeTotal: number;
  estado: EstadoReserva;
}

@Injectable()
export class ReservasService {
  constructor(
    @InjectRepository(Reserva)
    private readonly reservasRepository: Repository<Reserva>,
    @InjectRepository(Cliente)
    private readonly clientesRepository: Repository<Cliente>,
    @InjectRepository(Vehiculo)
    private readonly vehiculosRepository: Repository<Vehiculo>,
  ) {}

  async crearReserva(data: {
    clienteId: number;
    vehiculoId: number;
    fechaInicio: string | Date;
    fechaFin: string | Date;
  }): Promise<Reserva> {
    const inicio = new Date(data.fechaInicio);
    const fin = new Date(data.fechaFin);
    const ahora = new Date();

    if (inicio <= ahora) {
      throw new BadRequestException('La fecha de inicio debe ser futura.');
    }

    if (fin <= inicio) {
      throw new BadRequestException(
        'La fecha de finalización debe ser posterior a la fecha de inicio.',
      );
    }

    const cliente = await this.clientesRepository.findOne({
      where: { id: data.clienteId },
    });
    if (!cliente) {
      throw new NotFoundException('El cliente no existe.');
    }
    if (!cliente.activo) {
      throw new BadRequestException('El cliente se encuentra inactivo.');
    }

    const vehiculo = await this.vehiculosRepository.findOne({
      where: { id: data.vehiculoId },
    });
    if (!vehiculo) {
      throw new NotFoundException('El vehículo no existe.');
    }
    if (!vehiculo.activo) {
      throw new BadRequestException('El vehículo se encuentra inactivo.');
    }

    // Regla de no superposición de fechas
    const solapamiento = await this.reservasRepository
      .createQueryBuilder('reserva')
      .innerJoin('reserva.vehiculo', 'vehiculo')
      .where('vehiculo.id = :vehiculoId', { vehiculoId: vehiculo.id })
      .andWhere('reserva.estado = :estado', {
        estado: EstadoReserva.CONFIRMADA,
      })
      .andWhere('reserva.fechaInicio < :fin AND reserva.fechaFin > :inicio', {
        inicio,
        fin,
      })
      .getOne();

    if (solapamiento) {
      throw new BadRequestException(
        'El vehículo no se encuentra disponible en el período solicitado.',
      );
    }

    const cantidadDias = this.calcularCantidadDias(inicio, fin);
    const importeTotal = cantidadDias * Number(vehiculo.precioDiario);

    const nuevaReserva = this.reservasRepository.create({
      cliente,
      vehiculo,
      fechaInicio: inicio,
      fechaFin: fin,
      precioDiario: vehiculo.precioDiario,
      importeTotal,
      estado: EstadoReserva.CONFIRMADA,
    });

    return await this.reservasRepository.save(nuevaReserva);
  }

  async cancelarReserva(id: number): Promise<Reserva> {
    const reserva = await this.reservasRepository.findOne({ where: { id } });
    if (!reserva) {
      throw new NotFoundException('La reserva no existe.');
    }

    const ahora = new Date();
    if (new Date(reserva.fechaInicio) <= ahora) {
      throw new BadRequestException(
        'No se puede cancelar una reserva cuyo período ya ha comenzado.',
      );
    }

    reserva.estado = EstadoReserva.CANCELADA;
    return await this.reservasRepository.save(reserva);
  }

  buscar(filtros: FiltrosReservas, usuarioActual: Usuario): Promise<Reserva[]> {
    this.validarFiltros(filtros);

    const query = this.reservasRepository
      .createQueryBuilder('reserva')
      .innerJoinAndSelect('reserva.cliente', 'cliente')
      .innerJoinAndSelect('reserva.vehiculo', 'vehiculo');

    if (usuarioActual.rol === RolUsuario.CLIENTE) {
      if (!usuarioActual.cliente) {
        throw new ForbiddenException(
          'El usuario cliente no tiene un cliente asociado.',
        );
      }

      if (
        filtros.clienteId !== undefined &&
        filtros.clienteId !== usuarioActual.cliente.id
      ) {
        throw new ForbiddenException(
          'Un cliente no puede consultar reservas de otro cliente.',
        );
      }

      query.andWhere('cliente.id = :clienteActualId', {
        clienteActualId: usuarioActual.cliente.id,
      });
    } else if (usuarioActual.rol === RolUsuario.ADMIN) {
      if (filtros.clienteId !== undefined) {
        query.andWhere('cliente.id = :clienteId', {
          clienteId: filtros.clienteId,
        });
      }
    } else {
      throw new ForbiddenException('El usuario no posee un rol habilitado.');
    }

    if (filtros.vehiculoId !== undefined) {
      query.andWhere('vehiculo.id = :vehiculoId', {
        vehiculoId: filtros.vehiculoId,
      });
    }

    if (filtros.tipoVehiculo) {
      query.andWhere('vehiculo.tipo = :tipoVehiculo', {
        tipoVehiculo: filtros.tipoVehiculo,
      });
    }

    if (filtros.estado) {
      query.andWhere('reserva.estado = :estado', { estado: filtros.estado });
    }

    if (filtros.fechaInicio && filtros.fechaFin) {
      query
        .andWhere('reserva.fechaInicio < :fechaFin', {
          fechaFin: filtros.fechaFin,
        })
        .andWhere('reserva.fechaFin > :fechaInicio', {
          fechaInicio: filtros.fechaInicio,
        });
    }

    return query.orderBy('reserva.fechaInicio', 'DESC').getMany();
  }

  async buscarHistorialCliente(
    usuarioActual: Usuario,
  ): Promise<HistorialClienteItem[]> {
    if (usuarioActual.rol !== RolUsuario.CLIENTE) {
      throw new ForbiddenException(
        'El historial de alquileres está disponible únicamente para clientes.',
      );
    }

    if (!usuarioActual.cliente) {
      throw new ForbiddenException(
        'El usuario cliente no tiene un cliente asociado.',
      );
    }

    const ahora = new Date();
    const reservas = await this.reservasRepository
      .createQueryBuilder('reserva')
      .innerJoinAndSelect('reserva.vehiculo', 'vehiculo')
      .innerJoin('reserva.cliente', 'cliente')
      .where('cliente.id = :clienteId', {
        clienteId: usuarioActual.cliente.id,
      })
      .andWhere(
        `(
          reserva.estado IN (:...estadosHistorial)
          OR (
            reserva.estado IN (:...estadosActivos)
            AND reserva.fechaFin < :ahora
          )
        )`,
        {
          estadosHistorial: [EstadoReserva.FINALIZADA, EstadoReserva.CANCELADA],
          estadosActivos: [EstadoReserva.CONFIRMADA, EstadoReserva.EN_CURSO],
          ahora,
        },
      )
      .orderBy('reserva.fechaInicio', 'DESC')
      .getMany();

    return reservas.map((reserva) => ({
      id: reserva.id,
      vehiculo: reserva.vehiculo,
      fechaInicio: reserva.fechaInicio,
      fechaFin: reserva.fechaFin,
      cantidadDias: this.calcularCantidadDias(
        reserva.fechaInicio,
        reserva.fechaFin,
      ),
      importeTotal: reserva.importeTotal,
      estado:
        reserva.estado === EstadoReserva.CANCELADA
          ? EstadoReserva.CANCELADA
          : EstadoReserva.FINALIZADA,
    }));
  }

  private validarFiltros(filtros: FiltrosReservas): void {
    for (const [nombre, valor] of [
      ['clienteId', filtros.clienteId],
      ['vehiculoId', filtros.vehiculoId],
    ] as const) {
      if (valor !== undefined && valor <= 0) {
        throw new BadRequestException(`${nombre} debe ser mayor que cero.`);
      }
    }

    const tieneInicio = filtros.fechaInicio !== undefined;
    const tieneFin = filtros.fechaFin !== undefined;

    if (tieneInicio !== tieneFin) {
      throw new BadRequestException(
        'El rango requiere fechaInicio y fechaFin.',
      );
    }

    if (
      filtros.fechaInicio &&
      filtros.fechaFin &&
      filtros.fechaFin <= filtros.fechaInicio
    ) {
      throw new BadRequestException(
        'La fecha de finalización debe ser posterior a la fecha de inicio.',
      );
    }
  }

  private calcularCantidadDias(fechaInicio: Date, fechaFin: Date): number {
    const milisegundosPorDia = 1000 * 60 * 60 * 24;
    const duracion = fechaFin.getTime() - fechaInicio.getTime();

    return Math.max(1, Math.ceil(duracion / milisegundosPorDia));
  }
}
