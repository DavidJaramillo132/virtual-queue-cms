# Entidades (src/entities)

Propósito
--
Las entidades representan las tablas/objetos persistidos en la base de datos. Están decoradas con los decoradores de TypeORM (`@Entity`, `@PrimaryGeneratedColumn`, `@Column`, `@ManyToOne`, `@OneToMany`, etc.).

Estructura típica
--
- Cada archivo corresponde a una entidad: `Usuario.ts`, `Negocio.ts`, `Cita.ts`, etc.
- Usa decoradores para definir columnas y relaciones.

Ejemplo (esquema mínimo)
--
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ unique: true })
  email: string;
}

Relaciones
--
- Define relaciones entre entidades con `@ManyToOne`, `@OneToMany`, `@JoinColumn`, etc.
- Siempre piensa en cascades y onDelete cuando modeles relaciones (ej.: `onDelete: 'CASCADE'`).

Buenas prácticas
--
- Mantén la entidad enfocada en el mapeo DB; usa transformadores o getters si necesitas lógica adicional.
- No coloques lógica de negocio compleja dentro de las entidades.
- Añade índices (`@Index`) en columnas que se consultan frecuentemente.

Notas
--
- Si actualizas las entidades y usas `synchronize: true` en `DataSource`, TypeORM intentará sincronizar la estructura de la DB (solo para desarrollo).
