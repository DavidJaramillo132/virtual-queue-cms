import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, ManyToOne, JoinColumn, ManyToMany } from "typeorm";
import { Cita } from "./Cita";
import { Negocio } from "./Negocio";
import { Estacion } from "./Estacion";

@Entity({ name: "servicios" })
export class Servicio {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid", { nullable: false })
  negocio_id!: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
  nombre!: string;

  @Column({ type: "text", nullable: true })
  descripcion?: string;

  @Column({ type: "int", nullable: false })
  duracion_minutos!: number;

  @Column({ type: "int", nullable: false, default: 0 })
  precio_centavos!: number;

  @CreateDateColumn({ name: "creado_en" })
  creadoEn!: Date;

  // Relaciones
  @ManyToOne(() => Negocio, (negocio) => negocio.servicios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'negocio_id' })
  negocio!: Negocio;

  @OneToMany(() => Cita, (cita) => cita.servicio)
  citas!: Cita[];

  @ManyToMany(() => Estacion, (estacion) => estacion.servicios)
  estaciones!: Estacion[];
}