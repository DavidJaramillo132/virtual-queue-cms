import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Estacion } from "./IEstacion";
import { Usuario } from "./IUsuario";

@Entity({ name: "negocios" })
export class Negocio {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid", { nullable: true })
  admin_negocio_id?: string;

  @Column()
  nombre!: string;

  @Column()
  categoria!: string;

  @Column({ type: "text", nullable: true })
  descripcion?: string;

  @Column({ nullable: true })
  telefono?: string;

  @Column({ nullable: true })
  correo?: string;

  @Column({ nullable: true })
  imagen_url?: string;

  @Column({ default: true })
  estado!: boolean;

  @Column({ nullable: true })
  hora_atencion?: string;

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
}
