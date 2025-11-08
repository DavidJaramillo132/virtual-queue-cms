import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from "typeorm";
import { Usuario } from "./Usuario";
import { Servicio } from "./Servicio";
import { Negocio } from "./Negocio";
import { Estacion } from "./Estacion";

@Entity({ name: "citas" })
export class Cita {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid", { nullable: false })
  cliente_id!: string;

  @Column("uuid", { nullable: false })
  negocio_id!: string;

  @Column("uuid", { nullable: true })
  estacion_id?: string;

  @Column("uuid", { nullable: false })
  servicio_id!: string;

  @Column({ type: "date", nullable: false })
  fecha!: Date;

  @Column({ type: "time", nullable: false })
  hora_inicio!: string;

  @Column({ type: "time", nullable: false })
  hora_fin!: string;

  @Column({ 
    type: "enum", 
    enum: ["pendiente", "atendida", "cancelada"],
    enumName: "citas_estado_enum",
    default: "pendiente" 
  })
  estado!: "pendiente" | "atendida" | "cancelada";

  @CreateDateColumn({ name: "creado_en" })
  creadoEn!: Date;

  // Relaciones
  @ManyToOne(() => Usuario, (usuario) => usuario.citas, {
    onDelete: "RESTRICT"
  })
  @JoinColumn({ name: "cliente_id" })
  usuario!: Usuario;

  @ManyToOne(() => Negocio, (negocio) => negocio.citas, {
    onDelete: "RESTRICT"
  })
  @JoinColumn({ name: "negocio_id" })
  negocio!: Negocio;

  @ManyToOne(() => Estacion, (estacion) => estacion.citas, {
    nullable: true,
    onDelete: "SET NULL"
  })
  @JoinColumn({ name: "estacion_id" })
  estacion?: Estacion;

  @ManyToOne(() => Servicio, (servicio) => servicio.citas, {
    onDelete: "RESTRICT"
  })
  @JoinColumn({ name: "servicio_id" })
  servicio!: Servicio;
}
