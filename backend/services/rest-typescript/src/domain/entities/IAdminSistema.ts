import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Usuario } from "./IUsuario";

@Entity({ name: "admin_sistema" })
export class AdminSistema {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid", { nullable: true })
  usuario_id?: string;

  @Column()
  nombre!: string;

  @Column()
  apellidos!: string;

  @Column({ unique: true })
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
