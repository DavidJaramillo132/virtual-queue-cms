import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from "typeorm";
import { Cita } from "./Cita";
import { AdminSistema } from "./AdminSistema";
import { Negocio } from "./Negocio";

@Entity({ name: "usuarios" })
export class Usuario {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
  nombre!: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
  apellido!: string;

  @Column({ unique: true, type: 'varchar', nullable: false, default: '' })
  email!: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
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
