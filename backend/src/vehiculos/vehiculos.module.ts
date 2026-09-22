import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehiculo } from '../entities/vehiculo.entity';
import { VehiculosResolver } from '../graphql/vehiculos/vehiculos.resolver';
import { VehiculosService } from './vehiculos.service';
import { VehiculosController } from './vehiculos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Vehiculo])],
  controllers: [VehiculosController],
  providers: [VehiculosResolver, VehiculosService],
  exports: [VehiculosService],
})
export class VehiculosModule {}
