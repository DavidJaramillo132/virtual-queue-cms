from typing import List, Optional
import strawberry
from app.types.fila_type import Fila, EstadisticasFila, FilaConCitas, EstadoFila
from app.database.connection import get_db_connection

async def get_filas_activas(limit: int = 50) -> List[Fila]:
    """
    Obtiene las filas activas (abiertas)
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT id, id_cliente, date, start_time, state, cita_id
    FROM ifila
    WHERE state = 'abierta'
    ORDER BY date DESC, start_time DESC
    LIMIT %s
    """
    
    cursor.execute(query, (limit,))
    rows = cursor.fetchall()
    
    filas = []
    for row in rows:
        filas.append(Fila(
            id=row['id'],
            id_cliente=row['id_cliente'],
            date=row['date'],
            start_time=row['start_time'],
            state=EstadoFila.ABIERTA if row['state'] == 'abierta' else EstadoFila.CERRADA,
            cita_id=row.get('cita_id')
        ))
    
    cursor.close()
    conn.close()
    
    return filas

async def get_fila_by_id(id: str) -> Optional[Fila]:
    """
    Obtiene una fila por su ID
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT id, id_cliente, date, start_time, state, cita_id FROM ifila WHERE id = %s",
        (id,)
    )
    row = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if not row:
        return None
    
    return Fila(
        id=row['id'],
        id_cliente=row['id_cliente'],
        date=row['date'],
        start_time=row['start_time'],
        state=EstadoFila.ABIERTA if row['state'] == 'abierta' else EstadoFila.CERRADA,
        cita_id=row.get('cita_id')
    )

async def get_estadisticas_fila(id_fila: str) -> Optional[EstadisticasFila]:
    """
    Obtiene estadísticas detalladas de una fila
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Primero verificar que la fila existe
    cursor.execute("SELECT state FROM ifila WHERE id = %s", (id_fila,))
    fila = cursor.fetchone()
    
    if not fila:
        cursor.close()
        conn.close()
        return None
    
    # Obtener estadísticas de citas relacionadas
    query = """
    SELECT 
        COUNT(*) as total_citas,
        COUNT(CASE WHEN estado = 'atendida' THEN 1 END) as citas_atendidas,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as citas_pendientes,
        COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as citas_canceladas
    FROM icita
    WHERE id IN (
        SELECT cita_id FROM ifila WHERE id = %s AND cita_id IS NOT NULL
    )
    """
    
    cursor.execute(query, (id_fila,))
    stats = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    return EstadisticasFila(
        id_fila=id_fila,
        total_citas=stats['total_citas'] or 0,
        citas_atendidas=stats['citas_atendidas'] or 0,
        citas_pendientes=stats['citas_pendientes'] or 0,
        citas_canceladas=stats['citas_canceladas'] or 0,
        tiempo_promedio_espera=0.0,  # Calcular según lógica de negocio
        personas_en_espera=stats['citas_pendientes'] or 0,
        estado_actual=EstadoFila.ABIERTA if fila['state'] == 'abierta' else EstadoFila.CERRADA
    )

async def get_filas_por_negocio(id_negocio: str, limit: int = 20) -> List[FilaConCitas]:
    """
    Obtiene filas de un negocio específico con información de citas
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        f.id,
        f.date,
        f.start_time,
        f.state,
        COUNT(c.id) as total_citas,
        COUNT(CASE WHEN c.estado = 'pendiente' THEN 1 END) as citas_activas
    FROM ifila f
    LEFT JOIN icita c ON f.cita_id = c.id
    WHERE f.id_cliente IN (
        SELECT id FROM icliente WHERE rol = 'adminNegocio'
    )
    GROUP BY f.id, f.date, f.start_time, f.state
    ORDER BY f.date DESC
    LIMIT %s
    """
    
    cursor.execute(query, (limit,))
    rows = cursor.fetchall()
    
    filas = []
    for row in rows:
        filas.append(FilaConCitas(
            id=row['id'],
            date=row['date'],
            start_time=row['start_time'],
            state=EstadoFila.ABIERTA if row['state'] == 'abierta' else EstadoFila.CERRADA,
            total_citas=row['total_citas'] or 0,
            citas_activas=row['citas_activas'] or 0
        ))
    
    cursor.close()
    conn.close()
    
    return filas
