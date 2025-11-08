import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn, ManyToMany, JoinTable } from "typeorm";
import { Negocio } from "./Negocio";
import { HorarioAtencion } from "./HorarioAtencion";
import { Cita } from "./Cita";
import { Servicio } from "./Servicio";

@Entity({ name: "estaciones" })
export class Estacion {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid", { nullable: false })
  negocio_id!: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
  nombre!: string;

  @Column({ type: 'varchar', nullable: true })
  tipo?: string;

  @Column({ 
    type: "enum", 
    enum: ["activa", "inactiva"],
    enumName: "estaciones_estado_enum",
    default: "activa" 
  })
  estado!: "activa" | "inactiva";

  @CreateDateColumn({ name: "creado_en" })
  creadoEn!: Date;

  // Relaciones
  @ManyToOne(() => Negocio, (negocio) => negocio.estaciones, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "negocio_id" })
  negocio!: Negocio;

  @OneToMany(() => HorarioAtencion, (horario) => horario.estacion, {
    cascade: true,
  })
  horarios!: HorarioAtencion[];

  @OneToMany(() => Cita, (cita) => cita.estacion)
  citas!: Cita[];

  @ManyToMany(() => Servicio, (servicio) => servicio.estaciones)
  @JoinTable({
    name: "estacion_servicios",
    joinColumn: { name: "estacion_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "servicio_id", referencedColumnName: "id" }
  })
  servicios!: Servicio[];
}
