import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from "typeorm";
import { Cita } from "./ICita";
import { AdminSistema } from "./IAdminSistema";
import { Negocio } from "./INegocio";

@Entity({ name: "usuarios" })
export class Usuario {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  nombre!: string;

  @Column()
  apellido!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ 
    type: "simple-enum", 
    enum: ["cliente", "adminNegocio"],
    name: "rol"
  })
  rol!: "cliente" | "adminNegocio";

  @Column({ nullable: true })
  telefono?: string;

  @CreateDateColumn({ name: "creado_en" })
  creadoEn!: Date;

  // Relaciones
  @OneToMany(() => Cita, (cita) => cita.usuario)
  citas!: Cita[];

  @OneToMany(() => AdminSistema, (admin) => admin.usuario)
  adminSistema!: AdminSistema[];

  @OneToMany(() => Negocio, (negocio) => negocio.adminNegocio)
  negociosAdministrados!: Negocio[];
}
