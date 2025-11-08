export interface IUsuario {
  id: string;
  email: string;
  password: string;
  rol: 'cliente' | 'negocio' | 'admin_sistema';
  telefono?: string;
  nombre_completo: string;
  creadoEn?: Date;
}
