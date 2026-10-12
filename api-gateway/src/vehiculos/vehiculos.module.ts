import { Module } from '@nestjs/common';
import { VehiculosResolver } from '../graphql/vehiculos/vehiculos.resolver';
import { VehiculosController } from './vehiculos.controller';
import { VehiculosService } from './vehiculos.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ReservasModule } from '../reservas/reservas.module';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'VEHICLE_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'vehicle',
          protoPath: join(process.cwd(), 'src/proto/vehicle.proto'),
          url: process.env.VEHICLE_SERVICE_URL || 'localhost:9091',
        },
      },
    ]),
    ReservasModule,
    ClientsModule.register([
    ]),
  ],
  controllers: [VehiculosController],
  providers: [VehiculosService, VehiculosResolver],
  exports: [VehiculosService],
})
export class VehiculosModule { }