import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VehiculosService } from './vehiculos.service';
import { Vehiculo } from '../entities/vehiculo.entity';

@ApiTags('Vehículos')
@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Post()
  @ApiOperation({ summary: 'Alta de un nuevo vehículo (queda en estado DISPONIBLE)' })
  @ApiResponse({ status: 201, description: 'Vehículo creado correctamente.', type: Vehiculo })
  @ApiResponse({ status: 400, description: 'La patente ya se encuentra registrada.' })
  crear(@Body() body: Partial<Vehiculo>) {
    return this.vehiculosService.crear(body);
  }

  @Get()
  @ApiOperation({ summary: 'Consultar listado completo de vehículos' })
  @ApiResponse({ status: 200, description: 'Listado de vehículos devuelto exitosamente.', type: [Vehiculo] })
  obtenerTodos() {
    return this.vehiculosService.obtenerTodos();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un vehículo específico por ID' })
  @ApiResponse({ status: 200, description: 'Vehículo encontrado.', type: Vehiculo })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado.' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.vehiculosService.obtenerPorId(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modificar datos de un vehículo (patente no modificable)' })
  @ApiResponse({ status: 200, description: 'Vehículo actualizado exitosamente.', type: Vehiculo })
  @ApiResponse({ status: 400, description: 'Intento de modificación de la patente no permitido.' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado.' })
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<Vehiculo>) {
    return this.vehiculosService.actualizar(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Baja lógica de un vehículo (activo = false)' })
  @ApiResponse({ status: 200, description: 'Baja lógica realizada correctamente.', type: Vehiculo })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado.' })
  bajaLogica(@Param('id', ParseIntPipe) id: number) {
    return this.vehiculosService.bajaLogica(id);
  }
}