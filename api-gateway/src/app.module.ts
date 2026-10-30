import { Module } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ClientsModule, Transport } from '@nestjs/microservices';
import type { Request } from 'express';
import { join } from 'node:path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphqlStatusResolver } from './graphql/graphql-status.resolver';
import { AuthModule } from './auth/auth.module';
import { ReservasModule } from './reservas/reservas.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { ClientesModule } from './clientes/clientes.module';
import { GRPC_LOADER } from './proto/grpc-loader';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      context: ({ req }: { req: Request }) => ({ req }),
    }),
    ClientsModule.register([
      {
        name: 'VEHICLE_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'vehicle',
          protoPath: join(process.cwd(), 'src/proto/vehicle.proto'),
          url: process.env.VEHICLE_SERVICE_URL || 'localhost:9091',
          loader: GRPC_LOADER,
        },
      },
      {
        name: 'CUSTOMER_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'customer',
          protoPath: join(process.cwd(), 'src/proto/customer.proto'),
          url: process.env.CUSTOMER_SERVICE_URL || 'localhost:9092',
          loader: GRPC_LOADER,
        },
      },
      {
        name: 'RENTAL_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'rental',
          protoPath: join(process.cwd(), 'src/proto/rental.proto'),
          url: process.env.RENTAL_SERVICE_URL || 'localhost:9093',
          loader: GRPC_LOADER,
        },
      },
    ]),
    AuthModule,
    ClientesModule,
    VehiculosModule,
    ReservasModule,
  ],
  controllers: [AppController],
  providers: [AppService, GraphqlStatusResolver],
})
export class AppModule {}
