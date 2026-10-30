import { Module } from '@nestjs/common';
import { ReservasResolver } from '../graphql/reservas/reservas.resolver';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthModule } from '../auth/auth.module';
import { ClientesModule } from '../clientes/clientes.module';
import { join } from 'path';
import { GRPC_LOADER } from '../proto/grpc-loader';

@Module({
  imports: [
    AuthModule,
    ClientesModule,
    ClientsModule.register([
      {
        name: 'RENTAL_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'rental',
          protoPath: join(process.cwd(), 'src/proto/rental/rental.proto'),
          url: process.env.RENTAL_SERVICE_URL || 'localhost:9093',
          loader: GRPC_LOADER,
        },
      },
      {
        name: 'VEHICLE_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'vehicle',
          protoPath: join(process.cwd(), 'src/proto/vehicle/vehicle.proto'),
          url: process.env.VEHICLE_SERVICE_URL || 'localhost:9091',
          loader: GRPC_LOADER,
        },
      },
    ]),
  ],
  controllers: [ReservasController],
  providers: [ReservasService, ReservasResolver],
  exports: [ReservasService],
})
export class ReservasModule { }