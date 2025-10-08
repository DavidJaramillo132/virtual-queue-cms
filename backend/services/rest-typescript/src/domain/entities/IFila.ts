import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from "typeorm";
import { Estacion } from "./IEstacion";

@Entity({ name: "fila" })
export class Fila {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid", { nullable: true })
  estacion_id?: string;

  @Column({ type: "date" })
  fecha!: Date;

  @Column({ type: "time" })
  hora_inicio!: string;

  @Column({ type: "time" })
  hora_fin!: string;

  @Column({ 
    type: "simple-enum", 
    enum: ["abierta", "cerrada"], 
    default: "abierta" 
  })
  estado!: "abierta" | "cerrada";

  @CreateDateColumn({ name: "creado_en" })
  creadoEn!: Date;

  // Relaciones
  @ManyToOne(() => Estacion, (estacion) => estacion.filas, {
    nullable: true,
    onDelete: "SET NULL"
  })
  @JoinColumn({ name: "estacion_id" })
  estacion?: Estacion;
}