import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn } from "typeorm";

@Entity({ name: "estaciones" })
export class Estacion {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid", { nullable: true })
  negocio_id?: string;

  @Column()
  nombre!: string;

  @Column({ 
    type: "simple-enum", 
    enum: ["activo", "inactivo"], 
    default: "activo" 
  })
  estado!: "activo" | "inactivo";

  @CreateDateColumn({ name: "creado_en" })
  creadoEn!: Date;

  // Relaciones
  @ManyToOne("Negocio", "estaciones", {
    nullable: true,
    onDelete: "SET NULL"
  })
  @JoinColumn({ name: "negocio_id" })
  negocio?: any;

  @OneToMany("Fila", "estacion", {
    cascade: true,
  })
  filas!: any[];

  @OneToMany("HorarioAtencion", "estacion", {
    cascade: true,
  })
  horarios!: any[];
}
