import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehiculo } from '../entities/vehiculo.entity';
import { EstadoReserva } from '../enums/estado-reserva.enum';
import { TipoVehiculo } from '../enums/tipo-vehiculo.enum';

export interface FiltrosVehiculosDisponibles {
  fechaInicio: Date;
  fechaFin: Date;
  tipo?: TipoVehiculo;
  marca?: string;
  modelo?: string;
  precioDiarioMin?: number;
  precioDiarioMax?: number;
}

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly vehiculosRepository: Repository<Vehiculo>,
  ) {}

  async buscarDisponibles(
    filtros: FiltrosVehiculosDisponibles,
  ): Promise<Vehiculo[]> {
    this.validarFiltros(filtros);

    const query = this.vehiculosRepository
      .createQueryBuilder('vehiculo')
      .leftJoin(
        'vehiculo.reservas',
        'reservaSuperpuesta',
        `reservaSuperpuesta.estado != :estadoCancelada
          AND reservaSuperpuesta.fechaInicio < :fechaFin
          AND reservaSuperpuesta.fechaFin > :fechaInicio`,
        {
          estadoCancelada: EstadoReserva.CANCELADA,
          fechaInicio: filtros.fechaInicio,
          fechaFin: filtros.fechaFin,
        },
      )
      .where('vehiculo.activo = :activo', { activo: true })
      .andWhere('reservaSuperpuesta.id IS NULL');

    if (filtros.tipo) {
      query.andWhere('vehiculo.tipo = :tipo', { tipo: filtros.tipo });
    }

    const marca = filtros.marca?.trim();
    if (marca) {
      query.andWhere('LOWER(vehiculo.marca) LIKE :marca', {
        marca: `%${marca.toLowerCase()}%`,
      });
    }

    const modelo = filtros.modelo?.trim();
    if (modelo) {
      query.andWhere('LOWER(vehiculo.modelo) LIKE :modelo', {
        modelo: `%${modelo.toLowerCase()}%`,
      });
    }

    if (filtros.precioDiarioMin !== undefined) {
      query.andWhere('vehiculo.precioDiario >= :precioDiarioMin', {
        precioDiarioMin: filtros.precioDiarioMin,
      });
    }

    if (filtros.precioDiarioMax !== undefined) {
      query.andWhere('vehiculo.precioDiario <= :precioDiarioMax', {
        precioDiarioMax: filtros.precioDiarioMax,
      });
    }

    return query
      .orderBy('vehiculo.marca', 'ASC')
      .addOrderBy('vehiculo.modelo', 'ASC')
      .getMany();
  }

  private validarFiltros(filtros: FiltrosVehiculosDisponibles): void {
    if (filtros.fechaFin <= filtros.fechaInicio) {
      throw new BadRequestException(
        'La fecha de finalización debe ser posterior a la fecha de inicio.',
      );
    }

    if (filtros.precioDiarioMin !== undefined && filtros.precioDiarioMin < 0) {
      throw new BadRequestException(
        'El precio diario mínimo no puede ser negativo.',
      );
    }

    if (filtros.precioDiarioMax !== undefined && filtros.precioDiarioMax < 0) {
      throw new BadRequestException(
        'El precio diario máximo no puede ser negativo.',
      );
    }

    if (
      filtros.precioDiarioMin !== undefined &&
      filtros.precioDiarioMax !== undefined &&
      filtros.precioDiarioMax < filtros.precioDiarioMin
    ) {
      throw new BadRequestException(
        'El precio diario máximo debe ser mayor o igual al mínimo.',
      );
    }
  }
}
