// Interfaces compartidas para el módulo AdminGeneral

export interface EstadisticasGeneralData {
  totalNegocios: number;
  negociosActivos: number;
  totalUsuarios: number;
  totalCitas: number;
  crecimiento: number;
  advertencias: number;
  negociosConAdvertencias: number;
}

export interface CategoriaNegocio {
  nombre: string;
  cantidad: number;
}

export type TipoActividad = 'nuevo_negocio' | 'advertencia' | 'usuario_eliminado';

export interface ActividadReciente {
  tipo: TipoActividad;
  titulo: string;
  descripcion: string;
  tiempo: string;
}

export interface Negocio {
  id: number;
  nombre: string;
  categoria: string;
  descripcion: string;
  direccion: string;
  telefono: string;
  email: string;
  activo: boolean;
  tieneAdvertencia: boolean;
  fechaCreacion?: string;
  adminLocalId?: number;
}

export type RolUsuario = 'Cliente' | 'Admin Local' | 'Admin Sistema';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  fechaRegistro: string;
}

export type TipoReporte = 'negocios' | 'usuarios' | 'citas' | 'financiero';

export interface Reporte {
  id: TipoReporte;
  titulo: string;
  descripcion: string;
  icono: any;
  items: string[];
}
