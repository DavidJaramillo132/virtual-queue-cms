import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from "typeorm";
import { Cita } from "./ICita";

@Entity({ name: "servicios" })
export class Servicio {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  nombre!: string;

  @Column({ nullable: true })
  codigo?: string;

  @Column({ type: "text", nullable: true })
  descripcion?: string;

  @Column({ type: "int" })
  duracion_minutos!: number;

  @Column({ type: "int", default: 1 })
  capacidad!: number;

  @Column({ default: true })
  requiere_cita!: boolean;

  @Column({ type: "int", default: 0 })
  precio_centavos!: number;

  @Column({ default: true })
  visible!: boolean;

  @CreateDateColumn({ name: "creado_en" })
  creadoEn!: Date;

  // Relaciones
  @OneToMany(() => Cita, (cita) => cita.servicio)
  citas!: Cita[];
}