import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from "typeorm";
import { Estacion } from "./Estacion";

@Entity({ name: "horarios_atencion" })
export class HorarioAtencion {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid", { nullable: false })
  estacion_id!: string;

  @Column({ 
    type: "smallint",
    nullable: false
  })
  dia_semana!: number; // 0 (Domingo) a 6 (Sábado)

  @Column({ type: "time", nullable: false })
  hora_inicio!: string;

  @Column({ type: "time", nullable: false })
  hora_fin!: string;

  @CreateDateColumn({ name: "creado_en" })
  creadoEn!: Date;

  // Relaciones
  @ManyToOne(() => Estacion, (estacion) => estacion.horarios, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "estacion_id" })
  estacion!: Estacion;
}
