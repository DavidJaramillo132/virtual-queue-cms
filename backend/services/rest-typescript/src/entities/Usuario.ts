import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from "typeorm";
import { Cita } from "./Cita";
import { AdminSistema } from "./AdminSistema";
import { Negocio } from "./Negocio";

@Entity({ name: "usuarios" })
export class Usuario {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true, type: 'varchar', nullable: false })
  email!: string;

  @Column({ type: 'varchar', nullable: false })
  password!: string;

  @Column({ 
    type: "enum", 
    enum: ["cliente", "negocio", "admin_sistema"],
    enumName: "rol_usuario_enum",
    default: "cliente"
  })
  rol!: "cliente" | "negocio" | "admin_sistema";

  @Column({ type: 'varchar', nullable: true })
  telefono?: string;

  @Column({ type: 'varchar', nullable: false, default: '', name: "nombre_completo" })
  nombre_completo!: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  es_premium!: boolean;

  @CreateDateColumn({ name: "creado_en" })
  creadoEn!: Date;

  // Relaciones
  @OneToMany(() => Cita, (cita) => cita.usuario)
  citas!: Cita[];

  @OneToMany(() => AdminSistema, (admin) => admin.usuario)
  adminSistema!: AdminSistema[];

  @OneToMany(() => Negocio, (negocio) => negocio.adminNegocio)
  negocios!: Negocio[];
}
