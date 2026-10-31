import { Injectable, Inject, OnModuleInit, BadRequestException } from '@nestjs/common';
import { type ClientGrpc } from '@nestjs/microservices';
import { Observable, lastValueFrom } from 'rxjs';
import { ClientesService } from '../clientes/clientes.service';
import { EstadoMantenimiento } from '../enums/estado-mantenimiento.enum';

interface RentalServiceGrpc {
  createRental(data: any): Observable<{ rental: any }>;
  getRentals(data: any): Observable<any>;
  cancelRental(data: any): Observable<{ rental: any }>;
  getRentalHistory(data: any): Observable<any>;
}

interface VehicleServiceGrpc {
  getVehicles(data: { soloActivos: boolean }): Observable<{
    vehicles: Array<{
      id: number | string;
      tipo: number | string;
    }>;
  }>;
  getVehicleById(data: { id: number }): Observable<{ vehicle: { precioDiario: number } }>;
  // proto3 no envía los false: si el vehículo no está disponible, "disponible" llega vacío
  checkAvailability(data: { vehicleId: number; fechaInicio: string; fechaFin: string }): Observable<{
    disponible?: boolean;
    mensaje: string;
  }>;
}

@Injectable()
export class ReservasService implements OnModuleInit {
  private rentalGrpcService: RentalServiceGrpc;
  private vehicleGrpcService: VehicleServiceGrpc;

  constructor(@Inject('RENTAL_SERVICE') private readonly client: ClientGrpc, @Inject('VEHICLE_SERVICE') private readonly vehicleClient: ClientGrpc, private readonly clientesService: ClientesService) { }

  onModuleInit() {
    this.rentalGrpcService = this.client.getService<RentalServiceGrpc>('RentalService');
    this.vehicleGrpcService = this.vehicleClient.getService<VehicleServiceGrpc>('VehicleService');
  }

  // Coordina el alta como pide el enunciado: cliente activo, vehículo activo y precio del vehículo antes de reservar
  async crearReserva(data: any) {
    const cliente = await this.clientesService.validar(data.clienteId);
    if (!cliente.valido) {
      throw new BadRequestException(cliente.mensaje);
    }

    const disponibilidad = await lastValueFrom(this.vehicleGrpcService.checkAvailability({
      vehicleId: data.vehiculoId,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin,
    }));
    if (!disponibilidad.disponible) {
      throw new BadRequestException(disponibilidad.mensaje);
    }

    const responseVehiculo = await lastValueFrom(
      this.vehicleGrpcService.getVehicleById({ id: data.vehiculoId }),
    );

    const response = await lastValueFrom(this.rentalGrpcService.createRental({
      customerId: data.clienteId,
      vehicleId: data.vehiculoId,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin,
      precioDiario: responseVehiculo.vehicle.precioDiario,
    }));
    return this.normalizarReserva(response.rental);
  }

  async cancelarReserva(id: number) {
    const response = await lastValueFrom(this.rentalGrpcService.cancelRental({
      rentalId: id,
      customerId: 0,
    }));
    return this.normalizarReserva(response.rental);
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

    const reservas = (respuestaReservas.rentals || []).map((reserva: any) =>
      this.normalizarReserva(reserva),
    );
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

      return texto.replace(/^VEHICLE_TYPE_/, '');
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

    return (res.rentals || []).map((rental: any) =>
      this.normalizarReserva(rental),
    );
  }

  private normalizarReserva(reserva: any) {
    return {
      ...reserva,
      estado:
        typeof reserva.estado === 'string'
          ? reserva.estado.replace(/^RENTAL_STATUS_/, '')
          : reserva.estado,
      mantenimientoEstado: this.normalizarEstadoMantenimiento(
        reserva.mantenimientoEstado ?? reserva.mantenimiento_estado,
      ),
    };
  }

  private normalizarEstadoMantenimiento(estado: unknown): EstadoMantenimiento {
    if (
      estado === undefined ||
      estado === null ||
      estado === '' ||
      estado === 0 ||
      estado === '0' ||
      estado === 'MAINTENANCE_STATUS_UNSPECIFIED'
    ) {
      return EstadoMantenimiento.PENDIENTE;
    }

    const normalizado =
      typeof estado === 'string'
        ? estado.replace(/^MAINTENANCE_STATUS_/, '')
        : String(estado);

    if (
      Object.values(EstadoMantenimiento).includes(
        normalizado as EstadoMantenimiento,
      )
    ) {
      return normalizado as EstadoMantenimiento;
    }

    throw new Error(`Estado de mantenimiento gRPC desconocido: ${String(estado)}`);
  }
}