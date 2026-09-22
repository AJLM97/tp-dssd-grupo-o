import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TipoVehiculo } from '../enums/tipo-vehiculo.enum';
import { EstadoVehiculo } from '../enums/estado-vehiculo.enum';
import { Reserva } from './reserva.entity';

@Entity('vehiculos')
export class Vehiculo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  patente: string;

  @Column({ nullable: false })
  marca: string;

  @Column({ nullable: false })
  modelo: string;

  @Column({ type: 'int', nullable: false })
  anio: number;

  @Column({ nullable: true })
  color: string;

  @Column({
    type: 'enum',
    enum: TipoVehiculo,
    default: TipoVehiculo.SEDAN,
  })
  tipo: TipoVehiculo;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  precioDiario: number;

  @Column({
    type: 'enum',
    enum: EstadoVehiculo,
    default: EstadoVehiculo.DISPONIBLE,
  })
  estado: EstadoVehiculo;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @OneToMany(() => Reserva, (reserva) => reserva.vehiculo)
  reservas: Reserva[];
}