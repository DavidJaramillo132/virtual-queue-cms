export interface IUsuario {
  id: string;
  name: string;
  apellido: string;
  email: string;
  password: string;
  rol: 'cliente' | 'adminNegocio';
  telefono: string;
}
