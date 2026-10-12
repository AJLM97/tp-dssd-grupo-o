import { Module } from '@nestjs/common';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'CUSTOMER_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'customer',
          protoPath: join(process.cwd(), 'src/proto/customer.proto'),
          url: process.env.CUSTOMER_SERVICE_URL || 'localhost:9092',
        },
      },
    ]),
  ],
  controllers: [ClientesController],
  providers: [ClientesService],
  exports: [ClientesService],
})
export class ClientesModule {}