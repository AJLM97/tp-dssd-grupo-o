import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Injectable,
  NestInterceptor,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { status } from '@grpc/grpc-js';
import { Observable, catchError, throwError } from 'rxjs';

// Código gRPC que manda el servicio → excepción HTTP que recibe el front. Los demás siguen como 500
const EXCEPCION_POR_CODIGO_GRPC: Partial<
  Record<status, new (mensaje: string) => HttpException>
> = {
  [status.INVALID_ARGUMENT]: BadRequestException,
  [status.PERMISSION_DENIED]: ForbiddenException,
  [status.NOT_FOUND]: NotFoundException,
  [status.ALREADY_EXISTS]: ConflictException,
  [status.FAILED_PRECONDITION]: ConflictException,
  [status.UNAVAILABLE]: ServiceUnavailableException,
};

// Traduce en un solo lugar los errores de los servicios, para REST y GraphQL, con el mensaje que escribió el servicio
@Injectable()
export class ErroresGrpcInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      catchError((error) => {
        const Excepcion = EXCEPCION_POR_CODIGO_GRPC[error?.code as status];
        if (!Excepcion) {
          return throwError(() => error);
        }
        // El detalle de UNAVAILABLE trae direcciones internas: al front le llega un mensaje fijo
        const mensaje =
          error.code === status.UNAVAILABLE
            ? 'El servicio no está disponible, probá de nuevo en unos minutos.'
            : error.details;
        return throwError(() => new Excepcion(mensaje));
      }),
    );
  }
}
