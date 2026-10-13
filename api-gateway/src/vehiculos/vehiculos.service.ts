import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { type ClientGrpc } from '@nestjs/microservices';
import { Observable, lastValueFrom } from 'rxjs';
import { ReservasService } from '../reservas/reservas.service';

interface VehicleServiceGrpc {
  createVehicle(data: any): Observable<any>;
  updateVehicle(data: any): Observable<any>;
  deleteVehicle(data: { id: number }): Observable<any>;
  getVehicles(data: { solo_activos: boolean }): Observable<any>;
  getVehicleById(data: { id: number }): Observable<any>;
  checkAvailability(data: any): Observable<any>;
  updateVehicleStatus(data: any): Observable<any>;
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
    return await lastValueFrom(this.vehicleGrpcService.createVehicle(data));
  }

  async obtenerTodos() {
    const res = await lastValueFrom(this.vehicleGrpcService.getVehicles({ solo_activos: false }));
    return res.vehicles || [];
  }

  async obtenerPorId(id: number) {
    return await lastValueFrom(this.vehicleGrpcService.getVehicleById({ id }));
  }

  async actualizar(id: number, data: any) {
    return await lastValueFrom(this.vehicleGrpcService.updateVehicle({ id, ...data }));
  }

  async bajaLogica(id: number) {
    return await lastValueFrom(this.vehicleGrpcService.deleteVehicle({ id }));
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
        this.vehicleGrpcService.getVehicles({ solo_activos: true }),
      ),
      this.reservasService.buscar({}),
    ]);

    const vehiculos = respuestaVehiculos.vehicles || [];

    const tiposVehiculo: Record<number, string> = {
      1: 'SEDAN',
      2: 'SUV',
      3: 'PICKUP',
      4: 'COUPE',
      5: 'HATCHBACK',
    };

    return vehiculos.flatMap((vehiculo: any) => {
      const vehiculoId = Number(vehiculo.id);

      const ocupado = reservas.some((reserva: any) => {
        const estado =
          typeof reserva.estado === 'string'
            ? reserva.estado.toUpperCase()
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
      const tipo =
        typeof vehiculo.tipo === 'number'
          ? tiposVehiculo[vehiculo.tipo]
          : vehiculo.tipo;

      if (!tipo) {
        throw new Error(`Tipo de vehículo gRPC desconocido: ${vehiculo.tipo}`);
      }

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
}