import { Controller, Post, Put, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ReservasService, CrearReservaInput } from './reservas.service';
import { Reserva } from '../entities/reserva.entity';

@ApiTags('Reservas')
@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  @ApiOperation({ summary: 'Alta de reserva para un período determinado' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        idCliente: { type: 'number', example: 1 },
        idVehiculo: { type: 'number', example: 1 },
        fechaInicio: { type: 'string', example: '2026-10-01' },
        fechaFin: { type: 'string', example: '2026-10-05' },
      },
      required: ['idCliente', 'idVehiculo', 'fechaInicio', 'fechaFin'],
    },
  })
  @ApiResponse({ status: 201, description: 'Reserva creada en estado CONFIRMADA.', type: Reserva })
  @ApiResponse({ status: 400, description: 'Validación de cliente/auto inactivo, fechas pasadas o solapamiento fallida.' })
  @ApiResponse({ status: 404, description: 'Cliente o vehículo no encontrado.' })
  crear(@Body() body: CrearReservaInput) {
    return this.reservasService.crearReserva(body);
  }

  @Put(':id/cancelar')
  @ApiOperation({ summary: 'Cancelación de reserva (período aún no iniciado)' })
  @ApiResponse({ status: 200, description: 'Reserva actualizada a estado CANCELADA.', type: Reserva })
  @ApiResponse({ status: 400, description: 'El período de alquiler ya ha comenzado.' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada.' })
  cancelar(@Param('id', ParseIntPipe) id: number) {
    return this.reservasService.cancelarReserva(id);
  }
}