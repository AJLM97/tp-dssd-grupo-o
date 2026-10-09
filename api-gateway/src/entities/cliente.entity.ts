import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne } from 'typeorm';
import { Reserva } from './reserva.entity';
import { Usuario } from './usuario.entity';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  documento: string;

  @Column({ nullable: false })
  nombre: string;

  @Column({ nullable: false })
  apellido: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ type: 'date', nullable: true })
  fechaNacimiento: Date;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @OneToOne(() => Usuario, (usuario) => usuario.cliente)
  usuario: Usuario;

  @OneToMany(() => Reserva, (reserva) => reserva.cliente)
  reservas: Reserva[];
}