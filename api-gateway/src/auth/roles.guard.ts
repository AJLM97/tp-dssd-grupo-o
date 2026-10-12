import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolUsuario } from '../enums/rol-usuario.enum';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<RolUsuario[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!roles?.length) {
      return true;
    }

    const usuario = context.switchToHttp().getRequest().user;

    if (!roles.includes(usuario?.rol)) {
      throw new ForbiddenException('No tienes permisos para esta operación.');
    }

    return true;
  }
}