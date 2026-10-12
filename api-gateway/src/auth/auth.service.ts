import {
  Inject,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { status } from '@grpc/grpc-js';
import { type ClientGrpc } from '@nestjs/microservices';
import { Observable, lastValueFrom } from 'rxjs';
import { RolUsuario } from '../enums/rol-usuario.enum';

interface ClienteAutenticado {
  id: number | string;
  nombre: string;
  apellido: string;
  email: string;
  rol: number | string;
  activo: boolean;
}

interface CustomerServiceGrpc {
  authenticateCustomer(data: {
    email: string;
    password: string;
  }): Observable<ClienteAutenticado>;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private customerGrpcService: CustomerServiceGrpc;

  constructor(
    private readonly jwtService: JwtService,
    @Inject('CUSTOMER_SERVICE') private readonly client: ClientGrpc,
  ) { }

  onModuleInit() {
    this.customerGrpcService =
      this.client.getService<CustomerServiceGrpc>('CustomerService');
  }

  async generarToken(credenciales: { email: string; password: string }) {
    let cliente: ClienteAutenticado;

    try {
      cliente = await lastValueFrom(
        this.customerGrpcService.authenticateCustomer(credenciales),
      );
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === status.UNAUTHENTICATED
      ) {
        throw new UnauthorizedException('Email o contraseña incorrectos.');
      }

      throw error;
    }

    const id = Number(cliente?.id);
    if (!Number.isInteger(id) || id <= 0 || cliente.activo !== true) {
      throw new UnauthorizedException('Usuario no válido o inactivo.');
    }

    const rol = this.convertirRol(cliente.rol);

    const payload = {
      sub: id,
      email: cliente.email,
      rol,
      clienteId: rol === RolUsuario.CLIENTE ? id : undefined,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        email: cliente.email,
        rol,
      },
    };
  }

  private convertirRol(rol: number | string): RolUsuario {
    if (rol === 1 || rol === 'CLIENTE') {
      return RolUsuario.CLIENTE;
    }

    if (rol === 2 || rol === 'ADMINISTRADOR' || rol === 'ADMIN') {
      return RolUsuario.ADMIN;
    }

    throw new UnauthorizedException('El usuario tiene un rol no válido.');
  }
}