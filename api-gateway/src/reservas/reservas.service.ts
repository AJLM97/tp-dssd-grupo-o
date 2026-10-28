import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { type ClientGrpc } from '@nestjs/microservices';
import { Observable, lastValueFrom } from 'rxjs';

interface RentalServiceGrpc {
  createRental(data: any): Observable<any>;
  getRentals(data: any): Observable<any>;
  cancelRental(data: any): Observable<any>;
  getRentalHistory(data: any): Observable<any>;
}

interface VehicleServiceGrpc {
  getVehicles(data: { soloActivos: boolean }): Observable<{
    vehicles: Array<{
      id: number | string;
      tipo: number | string;
    }>;
  }>;
}

@Injectable()
export class ReservasService implements OnModuleInit {
  private rentalGrpcService: RentalServiceGrpc;
  private vehicleGrpcService: VehicleServiceGrpc;

  constructor(@Inject('RENTAL_SERVICE') private readonly client: ClientGrpc, @Inject('VEHICLE_SERVICE') private readonly vehicleClient: ClientGrpc) { }

  onModuleInit() {
    this.rentalGrpcService = this.client.getService<RentalServiceGrpc>('RentalService');
    this.vehicleGrpcService = this.vehicleClient.getService<VehicleServiceGrpc>('VehicleService');
  }

  async crearReserva(data: any) {
    return await lastValueFrom(this.rentalGrpcService.createRental({
      customerId: data.clienteId,
      vehicleId: data.vehiculoId,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin,
      precioDiario: data.precioDiario || 0,
    }));
  }

  async cancelarReserva(id: number) {
    return await lastValueFrom(this.rentalGrpcService.cancelRental({
      rentalId: id,
      customerId: 0,
    }));
  }

  async buscar(filtros: any) {
    const [respuestaReservas, respuestaVehiculos] = await Promise.all([
      lastValueFrom(
        this.rentalGrpcService.getRentals({
          customerId: filtros.clienteId || 0,
          vehicleId: filtros.vehiculoId || 0,
        }),
      ),
      lastValueFrom(
        this.vehicleGrpcService.getVehicles({ soloActivos: false }),
      ),
    ]);

    const reservas = respuestaReservas.rentals || [];
    const tiposPorNumero: Record<number, string> = {
      1: 'SEDAN',
      2: 'SUV',
      3: 'PICKUP',
      4: 'COUPE',
      5: 'HATCHBACK',
    };

    const normalizarTipo = (valor: number | string): string => {
      const texto = String(valor).trim().toUpperCase();

      if (/^\d+$/.test(texto)) {
        const tipo = tiposPorNumero[Number(texto)];
        if (!tipo) {
          throw new Error(`Tipo de vehículo gRPC desconocido: ${texto}`);
        }
        return tipo;
      }

      return texto;
    };

    const vehiculosPorId = new Map(
      (respuestaVehiculos.vehicles || []).map((vehiculo: any) => [
        Number(vehiculo.id),
        {
          ...vehiculo,
          tipo: normalizarTipo(vehiculo.tipo),
        },
      ]),
    );

    const enriquecidas = reservas.map((reserva: any) => {
      const vehiculoId = Number(reserva.vehicleId ?? reserva.vehicle_id);
      const vehiculo = vehiculosPorId.get(vehiculoId);

      if (!vehiculo) {
        throw new Error(
          `No se encontró el vehículo ${vehiculoId} asociado a la reserva ${reserva.id}`,
        );
      }

      return {
        ...reserva,
        vehiculo,
      };
    });

    if (!filtros.tipoVehiculo) {
      return enriquecidas;
    }

    const tipoSolicitado = normalizarTipo(filtros.tipoVehiculo);

    return enriquecidas.filter(
      (reserva: any) => reserva.vehiculo.tipo === tipoSolicitado,
    );
  }

  async buscarHistorialCliente(clienteId: number) {
    const res = await lastValueFrom(
      this.rentalGrpcService.getRentalHistory({
        customerId: clienteId,
      }),
    );

    return res.rentals || [];
  }
}