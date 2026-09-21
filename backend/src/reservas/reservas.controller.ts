import {
  Controller,
  Post,
  Put,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

import { ReservasService } from './reservas.service';
import { Reserva } from '../entities/reserva.entity';

@ApiTags('Reservas')
@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  @ApiOperation({
    summary: 'Alta de reserva para un período determinado',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        clienteId: {
          type: 'number',
          example: 1,
          description: 'Identificador del cliente que realiza la reserva',
        },
        vehiculoId: {
          type: 'number',
          example: 1,
          description: 'Identificador del vehículo a reservar',
        },
        fechaInicio: {
          type: 'string',
          format: 'date-time',
          example: '2026-09-25T10:00:00',
          description: 'Fecha y hora de inicio de la reserva',
        },
        fechaFin: {
          type: 'string',
          format: 'date-time',
          example: '2026-09-27T10:00:00',
          description: 'Fecha y hora de finalización de la reserva',
        },
      },
      required: [
        'clienteId',
        'vehiculoId',
        'fechaInicio',
        'fechaFin',
      ],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Reserva creada en estado CONFIRMADA.',
    type: Reserva,
  })
  @ApiResponse({
    status: 400,
    description:
      'Validación de cliente/auto inactivo, fechas pasadas o solapamiento fallida.',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente o vehículo no encontrado.',
  })
  crear(
    @Body()
    body: {
      clienteId: number;
      vehiculoId: number;
      fechaInicio: string;
      fechaFin: string;
    },
  ) {
    return this.reservasService.crearReserva(body);
  }

  @Put(':id/cancelar')
  @ApiOperation({
    summary: 'Cancelación de reserva (período aún no iniciado)',
  })
  @ApiResponse({
    status: 200,
    description: 'Reserva actualizada a estado CANCELADA.',
    type: Reserva,
  })
  @ApiResponse({
    status: 400,
    description: 'El período de alquiler ya ha comenzado.',
  })
  @ApiResponse({
    status: 404,
    description: 'Reserva no encontrada.',
  })
  cancelar(@Param('id', ParseIntPipe) id: number) {
    return this.reservasService.cancelarReserva(id);
  }
}