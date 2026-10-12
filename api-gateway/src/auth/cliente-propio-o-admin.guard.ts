import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { RolUsuario } from '../enums/rol-usuario.enum';

@Injectable()
export class ClientePropioOAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const usuario = request.user;

    if (usuario?.rol === RolUsuario.ADMIN) {
      return true;
    }

    const clienteIdAutenticado = Number(usuario?.clienteId);
    const clienteIdSolicitado = Number(request.params.id);

    if (
      usuario?.rol === RolUsuario.CLIENTE &&
      Number.isInteger(clienteIdAutenticado) &&
      clienteIdAutenticado === clienteIdSolicitado
    ) {
      return true;
    }

    throw new ForbiddenException(
      'No tienes permisos para realizar esta operación sobre este cliente.',
    );
  }
}