export interface IUsuario {
  id: string;
  nombreCompleto: string;
  email: string;
  password: string;
  rol: 'cliente' | 'Negocio' | 'admin';
  telefono: string;
  creado_en: Date;
}
