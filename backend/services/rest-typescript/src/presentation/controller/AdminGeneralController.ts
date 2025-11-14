import { Request, Response } from 'express';
import { NegocioRepo } from '../../repository/NegocioRepo';
import { UsuarioRepo } from '../../repository/UsuarioRepo';
import { CitaRepo } from '../../repository/CitaRepo';
import { AppDataSource } from '../../database/database';
import { Negocio } from '../../entities/index';

const negocioRepo = new NegocioRepo();
const usuarioRepo = new UsuarioRepo();
const citaRepo = new CitaRepo();

export class AdminGeneralController {
  /**
   * Obtiene las estadísticas generales de toda la plataforma
   * GET /api/admin/estadisticas
   */
  async getEstadisticas(req: Request, res: Response): Promise<void> {
    try {
      const [negocios, usuarios, citas] = await Promise.all([
        negocioRepo.getAll(),
        usuarioRepo.getAll(),
        citaRepo.getAll()
      ]);

      // Calcular estadísticas
      const totalNegocios = negocios.length;
      const negociosActivos = negocios.filter(n => n.estado !== false).length;
      const totalUsuarios = usuarios.length;
      
      // Filtrar citas del mes actual
      const ahora = new Date();
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      const citasDelMes = citas.filter(cita => {
        const fechaCita = new Date(cita.fecha);
        return fechaCita >= inicioMes;
      });
      const totalCitas = citasDelMes.length;

      // Calcular crecimiento (simplificado - comparar con mes anterior)
      const mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
      const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0);
      const citasMesAnterior = citas.filter(cita => {
        const fechaCita = new Date(cita.fecha);
        return fechaCita >= mesAnterior && fechaCita <= finMesAnterior;
      }).length;
      
      const crecimiento = citasMesAnterior > 0 
        ? ((totalCitas - citasMesAnterior) / citasMesAnterior) * 100 
        : 0;

      res.json({
        totalNegocios,
        negociosActivos,
        totalUsuarios,
        totalCitas,
        crecimiento: Math.round(crecimiento * 10) / 10, // Redondear a 1 decimal
        advertencias: 0,
        negociosConAdvertencias: 0
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtiene la distribución de negocios por categoría
   * GET /api/admin/categorias
   */
  async getCategorias(req: Request, res: Response): Promise<void> {
    try {
      const negocios = await negocioRepo.getAll();
      
      // Agrupar por categoría
      const categoriasMap = new Map<string, number>();
      
      negocios.forEach(negocio => {
        const categoria = negocio.categoria || 'Sin categoría';
        const cantidad = categoriasMap.get(categoria) || 0;
        categoriasMap.set(categoria, cantidad + 1);
      });

      // Convertir a array
      const categorias = Array.from(categoriasMap.entries()).map(([nombre, cantidad]) => ({
        nombre,
        cantidad
      }));

      // Ordenar por cantidad descendente
      categorias.sort((a, b) => b.cantidad - a.cantidad);

      res.json(categorias);
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }



}

