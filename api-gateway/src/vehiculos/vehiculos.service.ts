import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { type ClientGrpc } from '@nestjs/microservices';
import { Observable, lastValueFrom } from 'rxjs';
import { ReservasService } from '../reservas/reservas.service';
import { TipoVehiculo } from '../enums/tipo-vehiculo.enum';

interface VehicleServiceGrpc {
  createVehicle(data: any): Observable<{ vehicle: any }>;
  updateVehicle(data: any): Observable<{ vehicle: any }>;
  deleteVehicle(data: { id: number }): Observable<{ vehicle: any }>;
  getVehicles(data: { soloActivos: boolean }): Observable<{ vehicles: any[] }>;
  getVehicleById(data: { id: number }): Observable<{ vehicle: any }>;
  checkAvailability(data: any): Observable<any>;
  updateVehicleStatus(data: any): Observable<{ vehicle: any }>;
  checkAvailability(data: {
    vehicleId: number;
    fechaInicio: string;
    fechaFin: string;
  }): Observable<{ disponible: boolean }>;
}

@Injectable()
export class VehiculosService implements OnModuleInit {
  private vehicleGrpcService: VehicleServiceGrpc;

  constructor(@Inject('VEHICLE_SERVICE') private readonly client: ClientGrpc, private readonly reservasService: ReservasService) { }

  onModuleInit() {
    this.vehicleGrpcService = this.client.getService<VehicleServiceGrpc>('VehicleService');
  }

  async crear(data: any) {
    const response = await lastValueFrom(
      this.vehicleGrpcService.createVehicle(this.prepararVehiculo(data)),
    );
    return this.normalizarVehiculo(response.vehicle);
  }

  async obtenerTodos() {
    const res = await lastValueFrom(this.vehicleGrpcService.getVehicles({ soloActivos: false }));
    return (res.vehicles || []).map((vehicle) => this.normalizarVehiculo(vehicle));
  }

  async obtenerPorId(id: number) {
    const response = await lastValueFrom(this.vehicleGrpcService.getVehicleById({ id }));
    return this.normalizarVehiculo(response.vehicle);
  }

  async actualizar(id: number, data: any) {
    const response = await lastValueFrom(
      this.vehicleGrpcService.updateVehicle({
        id,
        ...this.prepararVehiculo(data),
      }),
    );
    return this.normalizarVehiculo(response.vehicle);
  }

  async bajaLogica(id: number) {
    const response = await lastValueFrom(this.vehicleGrpcService.deleteVehicle({ id }));
    return this.normalizarVehiculo(response.vehicle);
  }

  async buscarDisponibles(filtros: any) {
    const fechaInicio = new Date(filtros.fechaInicio).getTime();
    const fechaFin = new Date(filtros.fechaFin).getTime();

    if (
      !Number.isFinite(fechaInicio) ||
      !Number.isFinite(fechaFin) ||
      fechaFin <= fechaInicio
    ) {
      throw new Error('El período solicitado no es válido.');
    }

    const [respuestaVehiculos, reservas] = await Promise.all([
      lastValueFrom(
        this.vehicleGrpcService.getVehicles({ soloActivos: true }),
      ),
      this.reservasService.buscar({}),
    ]);

    const vehiculos = respuestaVehiculos.vehicles || [];

    return vehiculos.flatMap((vehiculo: any) => {
      const vehiculoId = Number(vehiculo.id);

      const ocupado = reservas.some((reserva: any) => {
        const estado =
          typeof reserva.estado === 'string'
            ? reserva.estado.toUpperCase().replace(/^RENTAL_STATUS_/, '')
            : ({
              1: 'CONFIRMADA',
              2: 'EN_CURSO',
              3: 'FINALIZADA',
              4: 'CANCELADA',
            } as Record<number, string>)[Number(reserva.estado)];

        if (estado !== 'CONFIRMADA' && estado !== 'EN_CURSO') {
          return false;
        }

        const reservaVehiculoId = Number(
          reserva.vehicleId ?? reserva.vehicle_id,
        );
        const inicioReserva = new Date(
          reserva.fechaInicio ?? reserva.fecha_inicio,
        ).getTime();
        const finReserva = new Date(
          reserva.fechaFin ?? reserva.fecha_fin,
        ).getTime();

        return (
          reservaVehiculoId === vehiculoId &&
          inicioReserva < fechaFin &&
          finReserva > fechaInicio
        );
      });

      if (ocupado) {
        return [];
      }

      const precioDiario = Number(vehiculo.precioDiario);
      const tipo = this.normalizarTipo(vehiculo.tipo);

      if (filtros.tipo && tipo !== filtros.tipo) return [];
      if (
        filtros.marca &&
        !String(vehiculo.marca)
          .toLowerCase()
          .includes(filtros.marca.toLowerCase())
      ) {
        return [];
      }
      if (
        filtros.modelo &&
        !String(vehiculo.modelo)
          .toLowerCase()
          .includes(filtros.modelo.toLowerCase())
      ) {
        return [];
      }
      if (
        filtros.precioDiarioMin != null &&
        precioDiario < filtros.precioDiarioMin
      ) {
        return [];
      }
      if (
        filtros.precioDiarioMax != null &&
        precioDiario > filtros.precioDiarioMax
      ) {
        return [];
      }

      return [
        {
          id: vehiculoId,
          patente: vehiculo.patente,
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
          anio: Number(vehiculo.anio),
          color: vehiculo.color,
          tipo,
          precioDiario,
        },
      ];
    });
  }

  private prepararVehiculo(data: any) {
    if (typeof data.tipo !== 'string' || data.tipo.startsWith('VEHICLE_TYPE_')) {
      return data;
    }

    return { ...data, tipo: `VEHICLE_TYPE_${data.tipo}` };
  }

  private normalizarVehiculo(vehicle: any) {
    return {
      ...vehicle,
      tipo: this.normalizarTipo(vehicle.tipo),
      estado:
        typeof vehicle.estado === 'string'
          ? vehicle.estado.replace(/^VEHICLE_STATUS_/, '')
          : vehicle.estado,
      verificacion:
        typeof vehicle.verificacion === 'string'
          ? vehicle.verificacion.replace(/^VEHICLE_VERIFICATION_/, '')
          : vehicle.verificacion,
    };
  }

  private normalizarTipo(tipo: number | string): TipoVehiculo {
    const tiposVehiculo: Record<number, string> = {
      1: 'SEDAN',
      2: 'SUV',
      3: 'PICKUP',
      4: 'COUPE',
      5: 'HATCHBACK',
    };

    const normalizado =
      typeof tipo === 'number'
        ? tiposVehiculo[tipo]
        : String(tipo).replace(/^VEHICLE_TYPE_/, '').toUpperCase();

    switch (normalizado) {
      case 'SEDAN':
        return TipoVehiculo.SEDAN;
      case 'SUV':
        return TipoVehiculo.SUV;
      case 'PICKUP':
        return TipoVehiculo.PICKUP;
      case 'COUPE':
        return TipoVehiculo.COUPE;
      case 'HATCHBACK':
        return TipoVehiculo.HATCHBACK;
      default:
        throw new Error(`Tipo de vehículo gRPC desconocido: ${tipo}`);
    }
  }
}