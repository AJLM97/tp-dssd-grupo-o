import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';

interface ContextoGraphql {
  req: Request;
  usuarioActual?: Usuario;
}

@Injectable()
export class IdentidadTemporalGuard implements CanActivate {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const contexto =
      GqlExecutionContext.create(context).getContext<ContextoGraphql>();
    const valorHeader = contexto.req.headers['x-usuario-id'];
    const usuarioId =
      typeof valorHeader === 'string' ? Number(valorHeader) : Number.NaN;

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new UnauthorizedException(
        'Se requiere el header temporal x-usuario-id con un identificador válido.',
      );
    }

    const usuario = await this.usuariosRepository.findOne({
      where: { id: usuarioId, activo: true },
      relations: { cliente: true },
    });

    if (!usuario) {
      throw new UnauthorizedException(
        'El usuario indicado no existe o está inactivo.',
      );
    }

    contexto.usuarioActual = usuario;
    return true;
  }
}

export const UsuarioActual = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Usuario | undefined =>
    GqlExecutionContext.create(context).getContext<ContextoGraphql>()
      .usuarioActual,
);
