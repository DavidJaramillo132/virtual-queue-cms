import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Usuario } from "./Usuario";

@Entity({ name: "admin_sistema" })
export class AdminSistema {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid", { unique: true, nullable: false })
  usuario_id!: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
  nombre!: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
  apellidos!: string;

  @Column({ type: 'varchar', nullable: true })
  telefono?: string;

  // Relación con Usuario
  @ManyToOne(() => Usuario, (usuario) => usuario.adminSistema, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "usuario_id" })
  usuario!: Usuario;
}
