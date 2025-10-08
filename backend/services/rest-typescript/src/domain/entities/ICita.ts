import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from "typeorm";
import { Usuario } from "./IUsuario";
import { Servicio } from "./IServicio";

@Entity({ name: "citas" })
export class Cita {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid", { nullable: true })
  usuario_id?: string;

  @Column("uuid", { nullable: true })
  servicio_id?: string;

  @Column({ type: "date" })
  fecha!: Date;

  @Column({ type: "time" })
  hora_inicio!: string;

  @Column({ type: "time" })
  hora_fin!: string;

  @Column({ 
    type: "simple-enum", 
    enum: ["pendiente", "atendida", "cancelada"], 
    default: "pendiente" 
  })
  estado!: "pendiente" | "atendida" | "cancelada";

  @CreateDateColumn({ name: "creado_en" })
  creadoEn!: Date;

  // Relaciones
  @ManyToOne(() => Usuario, (usuario) => usuario.citas, {
    nullable: true,
    onDelete: "SET NULL"
  })
  @JoinColumn({ name: "usuario_id" })
  usuario?: Usuario;

  @ManyToOne(() => Servicio, (servicio) => servicio.citas, {
    nullable: true,
    onDelete: "SET NULL"
  })
  @JoinColumn({ name: "servicio_id" })
  servicio?: Servicio;
}
