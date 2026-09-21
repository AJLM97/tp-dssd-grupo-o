import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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

import { ClientesService } from './clientes.service';
import { Cliente } from '../entities/cliente.entity';

@ApiTags('Clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @ApiOperation({ summary: 'Alta de un nuevo cliente' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        documento: {
          type: 'string',
          example: '45065887',
        },
        nombre: {
          type: 'string',
          example: 'Valentina',
        },
        apellido: {
          type: 'string',
          example: 'Ponzo',
        },
        email: {
          type: 'string',
          example: 'valentina.prueba@gmail.com',
        },
        telefono: {
          type: 'string',
          example: '1123456789',
        },
        fechaNacimiento: {
          type: 'string',
          format: 'date',
          example: '2000-01-01',
        },
        activo: {
          type: 'boolean',
          example: true,
        },
      },
      required: ['documento', 'nombre', 'apellido', 'email'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Cliente creado correctamente.',
    type: Cliente,
  })
  @ApiResponse({
    status: 400,
    description: 'Documento o email ya registrado.',
  })
  crear(@Body() body: Partial<Cliente>) {
    return this.clientesService.crear(body);
  }

  @Get()
  @ApiOperation({ summary: 'Consultar listado completo de clientes' })
  @ApiResponse({
    status: 200,
    description: 'Listado de clientes devuelto exitosamente.',
    type: [Cliente],
  })
  obtenerTodos() {
    return this.clientesService.obtenerTodos();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un cliente específico por ID' })
  @ApiResponse({
    status: 200,
    description: 'Cliente encontrado.',
    type: Cliente,
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente no encontrado.',
  })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.obtenerPorId(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modificar datos de un cliente' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nombre: {
          type: 'string',
          example: 'Valentina',
        },
        apellido: {
          type: 'string',
          example: 'Ponzo',
        },
        email: {
          type: 'string',
          example: 'valentina.actualizada@gmail.com',
        },
        telefono: {
          type: 'string',
          example: '1198765432',
        },
        fechaNacimiento: {
          type: 'string',
          format: 'date',
          example: '2000-01-01',
        },
        activo: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cliente actualizado exitosamente.',
    type: Cliente,
  })
  @ApiResponse({
    status: 400,
    description: 'Documento o email en conflicto.',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente no encontrado.',
  })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Partial<Cliente>,
  ) {
    return this.clientesService.actualizar(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Baja lógica de un cliente (activo = false)' })
  @ApiResponse({
    status: 200,
    description: 'Baja lógica realizada correctamente.',
    type: Cliente,
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente no encontrado.',
  })
  bajaLogica(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.bajaLogica(id);
  }
}