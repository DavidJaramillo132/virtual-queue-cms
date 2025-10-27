from typing import List, Optional
import strawberry
from app.types.negocio_type import Negocio, EstadisticasNegocio
from app.database.connection import get_db_connection

async def get_negocios(
    categoria: Optional[str] = None,
    estado: Optional[bool] = None,
    limit: int = 100
) -> List[Negocio]:
    """
    Obtiene lista de negocios con filtros opcionales
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM inegocio WHERE 1=1"
    params = []
    
    if categoria:
        query += " AND categoria = %s"
        params.append(categoria)
    
    if estado is not None:
        query += " AND estado = %s"
        params.append(estado)
    
    query += " ORDER BY nombre LIMIT %s"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    negocios = []
    for row in rows:
        negocios.append(Negocio(
            id=row['id'],
            nombre=row['nombre'],
            categoria=row['categoria'],
            descripcion=row.get('descripcion'),
            ubicacion=row['ubicacion'],
            telefono=row.get('telefono'),
            correo=row.get('correo'),
            imagen_url=row.get('imagen_url'),
            estado=row['estado'],
            hora_de_atencion=row['hora_de_atencion']
        ))
    
    cursor.close()
    conn.close()
    
    return negocios

async def get_negocio_by_id(id: str) -> Optional[Negocio]:
    """
    Obtiene un negocio por su ID
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM inegocio WHERE id = %s", (id,))
    row = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if not row:
        return None
    
    return Negocio(
        id=row['id'],
        nombre=row['nombre'],
        categoria=row['categoria'],
        descripcion=row.get('descripcion'),
        ubicacion=row['ubicacion'],
        telefono=row.get('telefono'),
        correo=row.get('correo'),
        imagen_url=row.get('imagen_url'),
        estado=row['estado'],
        hora_de_atencion=row['hora_de_atencion']
    )

async def get_estadisticas_negocio(id_negocio: str) -> Optional[EstadisticasNegocio]:
    """
    Obtiene estadísticas completas de un negocio
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verificar que el negocio existe
    cursor.execute("SELECT nombre FROM inegocio WHERE id = %s", (id_negocio,))
    negocio = cursor.fetchone()
    
    if not negocio:
        cursor.close()
        conn.close()
        return None
    
    # Obtener estadísticas
    query = """
    SELECT 
        COUNT(c.id) as total_citas,
        COUNT(CASE WHEN c.estado = 'atendida' THEN 1 END) as citas_atendidas,
        COUNT(CASE WHEN c.estado = 'pendiente' THEN 1 END) as citas_pendientes,
        COUNT(CASE WHEN c.estado = 'cancelada' THEN 1 END) as citas_canceladas,
        COUNT(DISTINCT c.id_cliente) as clientes_unicos,
        AVG(s.duracion_minutos) as tiempo_promedio,
        SUM(CASE WHEN c.estado = 'atendida' THEN s.precio_centavos ELSE 0 END) as ingresos_totales
    FROM iservicio s
    LEFT JOIN icita c ON s.id = c.servicio_id
    WHERE s.negocio_id = %s
    """
    
    cursor.execute(query, (id_negocio,))
    stats = cursor.fetchone()
    
    # Contar servicios activos
    cursor.execute(
        "SELECT COUNT(*) as total FROM iservicio WHERE negocio_id = %s AND visible = true",
        (id_negocio,)
    )
    servicios = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    return EstadisticasNegocio(
        negocio_id=id_negocio,
        nombre=negocio['nombre'],
        total_citas=stats['total_citas'] or 0,
        citas_atendidas=stats['citas_atendidas'] or 0,
        citas_pendientes=stats['citas_pendientes'] or 0,
        citas_canceladas=stats['citas_canceladas'] or 0,
        tiempo_promedio_atencion=float(stats['tiempo_promedio'] or 0),
        clientes_unicos=stats['clientes_unicos'] or 0,
        servicios_activos=servicios['total'] or 0,
        ingresos_totales=(stats['ingresos_totales'] or 0) / 100.0,
        calificacion_promedio=None  # Implementar si existe sistema de calificaciones
    )
