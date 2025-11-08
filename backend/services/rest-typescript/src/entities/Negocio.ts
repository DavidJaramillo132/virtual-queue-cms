import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Estacion } from "./Estacion";
import { Usuario } from "./Usuario";
import { Servicio } from "./Servicio";
import { Cita } from "./Cita";

@Entity({ name: "negocios" })
export class Negocio {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid", { nullable: true })
  admin_negocio_id?: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
  nombre!: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
  categoria!: string;

  @Column({ type: "text", nullable: true })
  descripcion?: string;

  @Column({ type: 'varchar', nullable: true })
  telefono?: string;

  @Column({ type: 'varchar', nullable: true })
  correo?: string;

  @Column({ type: 'varchar', nullable: true })
  direccion?: string;

  @Column({ type: 'varchar', nullable: true })
  imagen_url?: string;

  @Column({ type: 'boolean', nullable: false, default: true })
  estado!: boolean;

  @Column({ type: 'varchar', nullable: true })
  horario_general?: string;

  @CreateDateColumn({ name: "creado_en" })
  creadoEn!: Date;

  // Relaciones
  @ManyToOne(() => Usuario, (usuario) => usuario.negociosAdministrados, {
    nullable: true,
    onDelete: "SET NULL"
  })
  @JoinColumn({ name: "admin_negocio_id" })
  adminNegocio?: Usuario;

  @OneToMany(() => Estacion, (estacion) => estacion.negocio, {
    cascade: true,
  })
  estaciones!: Estacion[];

  @OneToMany(() => Servicio, (servicio) => servicio.negocio, {
    cascade: true,
  })
  servicios!: Servicio[];

  @OneToMany(() => Cita, (cita) => cita.negocio)
  citas!: Cita[];
}
