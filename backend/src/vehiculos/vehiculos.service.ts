import { BadRequestException, Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehiculo } from '../entities/vehiculo.entity';
import { EstadoReserva } from '../enums/estado-reserva.enum';
import { TipoVehiculo } from '../enums/tipo-vehiculo.enum';
import { EstadoVehiculo } from '../enums/estado-vehiculo.enum';

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

  /*async crear(data: Partial<Vehiculo>): Promise<Vehiculo> {
    const existe = await this.vehiculosRepository.findOne({ where: { patente: data.patente } });
    if (existe) {
      throw new BadRequestException('La patente ya se encuentra registrada');
    }
    const nuevo = this.vehiculosRepository.create({
      ...data,
      estado: EstadoVehiculo.DISPONIBLE,
      activo: true,
    });
    return await this.vehiculosRepository.save(nuevo);
  }*/

  async crear(body: any) {
    const { patente } = body;

    // 1. Verificación previa
    if (patente) {
      const existe = await this.vehiculosRepository.findOne({ where: { patente } });
      if (existe) {
        throw new ConflictException(`La patente ${patente} ya se encuentra registrada.`);
      }
    }

    try {
      // 2. Intento de guardado
      const nuevoVehiculo = this.vehiculosRepository.create(body);
      return await this.vehiculosRepository.save(nuevoVehiculo);
    } catch (error) {
      // Si ocurre un error inesperado de base de datos, mostramos el detalle en consola
      console.error('Error al crear vehículo:', error);
      throw new InternalServerErrorException('Error al registrar el vehículo en la base de datos.');
    }
  
}

  async obtenerTodos(): Promise<Vehiculo[]> {
    return await this.vehiculosRepository.find();
  }

  async obtenerPorId(id: number): Promise<Vehiculo> {
    const vehiculo = await this.vehiculosRepository.findOne({ where: { id } });
    if (!vehiculo) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    return vehiculo;
  }

  async actualizar(id: number, data: Partial<Vehiculo>): Promise<Vehiculo> {
    if (!data) {
      throw new BadRequestException('Debe enviar datos para actualizar el vehículo');
    }
    const vehiculo = await this.obtenerPorId(id);
    if (data.patente && data.patente !== vehiculo.patente) {
      throw new BadRequestException('La patente no se puede modificar');
    }
    Object.assign(vehiculo, data);
    return await this.vehiculosRepository.save(vehiculo);
  }

  async bajaLogica(id: number): Promise<Vehiculo> {
    const vehiculo = await this.obtenerPorId(id);
    vehiculo.activo = false;
    return await this.vehiculosRepository.save(vehiculo);
  }

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
