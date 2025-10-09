import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Usuario } from "./Usuario";

@Entity({ name: "admin_sistema" })
export class AdminSistema {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid", { nullable: true })
  usuario_id?: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
  nombre!: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
  apellidos!: string;

  @Column({ unique: true, type: 'varchar', nullable: false, default: '' })
  email!: string;

  @Column({ nullable: true })
  telefono?: string;

  // Relación con Usuario
  @ManyToOne(() => Usuario, (usuario) => usuario.adminSistema, {
    nullable: true,
    onDelete: "SET NULL"
  })
  @JoinColumn({ name: "usuario_id" })
  usuario?: Usuario;
}
