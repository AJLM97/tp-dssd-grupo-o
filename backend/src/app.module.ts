import { Module } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import type { Request } from 'express';
import { join } from 'node:path';
import { GraphqlStatusResolver } from './graphql/graphql-status.resolver';
import { ReservasModule } from './reservas/reservas.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { ClientesModule } from './clientes/clientes.module';

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
    ClientesModule,
    VehiculosModule,
    ReservasModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '1234',
      database: process.env.DB_NAME || 'rentar_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Crea las tablas automáticamente en desarrollo
      dropSchema: false,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, GraphqlStatusResolver],
})
export class AppModule {}
