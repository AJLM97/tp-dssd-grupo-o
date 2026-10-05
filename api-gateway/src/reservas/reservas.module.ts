import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentidadTemporalGuard } from '../auth/identidad-temporal.graphql';
import { Reserva } from '../entities/reserva.entity';
import { Usuario } from '../entities/usuario.entity';
import { Cliente } from '../entities/cliente.entity';
import { Vehiculo } from '../entities/vehiculo.entity';
import { ReservasResolver } from '../graphql/reservas/reservas.resolver';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reserva, Usuario, Cliente, Vehiculo])],
  controllers: [ReservasController],
  providers: [IdentidadTemporalGuard, ReservasResolver, ReservasService],
  exports: [ReservasService],
})
export class ReservasModule {}