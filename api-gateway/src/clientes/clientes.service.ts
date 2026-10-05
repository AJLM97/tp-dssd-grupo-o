import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from '../entities/cliente.entity';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
  ) {}

  async crear(data: Partial<Cliente>): Promise<Cliente> {
    if (!data.documento) {
      throw new BadRequestException('El campo documento es obligatorio.');
    }
    if (!data.email) {
      throw new BadRequestException('El campo email es obligatorio.');
    }

    const existeDoc = await this.clienteRepo.findOne({ where: { documento: data.documento } });
    if (existeDoc) {
      throw new BadRequestException('El documento ya se encuentra registrado');
    }

    const existeEmail = await this.clienteRepo.findOne({ where: { email: data.email } });
    if (existeEmail) {
      throw new BadRequestException('El email ya se encuentra registrado');
    }

    const cliente = this.clienteRepo.create({
      ...data,
      activo: true,
    });
    return await this.clienteRepo.save(cliente);
  }

  async obtenerTodos(): Promise<Cliente[]> {
    return await this.clienteRepo.find();
  }

  async obtenerPorId(id: number): Promise<Cliente> {
    const cliente = await this.clienteRepo.findOne({ where: { id } });
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return cliente;
  }

  async actualizar(id: number, data: Partial<Cliente>): Promise<Cliente> {
    const cliente = await this.obtenerPorId(id);

    if (data.documento && data.documento !== cliente.documento) {
      const existeDoc = await this.clienteRepo.findOne({ where: { documento: data.documento } });
      if (existeDoc) {
        throw new BadRequestException('El documento ingresado ya pertenece a otro cliente');
      }
    }

    if (data.email && data.email !== cliente.email) {
      const existeEmail = await this.clienteRepo.findOne({ where: { email: data.email } });
      if (existeEmail) {
        throw new BadRequestException('El email ingresado ya pertenece a otro cliente');
      }
    }

    Object.assign(cliente, data);
    return await this.clienteRepo.save(cliente);
  }

  async bajaLogica(id: number): Promise<Cliente> {
    const cliente = await this.obtenerPorId(id);
    cliente.activo = false;
    return await this.clienteRepo.save(cliente);
  }
}