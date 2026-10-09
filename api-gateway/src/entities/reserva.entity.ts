import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Cliente } from './cliente.entity';
import { Vehiculo } from './vehiculo.entity';
import { EstadoReserva } from '../enums/estado-reserva.enum';

@Entity('reservas')
export class Reserva {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Cliente, (cliente) => cliente.reservas, { nullable: false })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @ManyToOne(() => Vehiculo, (vehiculo) => vehiculo.reservas, { nullable: false })
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Vehiculo;

  @Column({ type: 'datetime', nullable: false })
  fechaInicio: Date;

  @Column({ type: 'datetime', nullable: false })
  fechaFin: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  precioDiario: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  importeTotal: number;

  @Column({
    type: 'enum',
    enum: EstadoReserva,
    default: EstadoReserva.CONFIRMADA,
  })
  estado: EstadoReserva;
}