import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehiculo } from '../entities/vehiculo.entity';
import { VehiculosResolver } from '../graphql/vehiculos/vehiculos.resolver';
import { VehiculosService } from './vehiculos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vehiculo])],
  providers: [VehiculosResolver, VehiculosService],
  exports: [VehiculosService],
})
export class VehiculosModule {}
