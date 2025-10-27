from typing import List, Optional
from datetime import datetime
import strawberry
from app.types.cita_type import Cita, CitaDetallada, CitaFiltro, EstadoCita
from app.database.connection import get_db_connection

async def get_citas_por_cliente(id_cliente: str, limit: int = 50) -> List[Cita]:
    """
    Obtiene todas las citas de un cliente
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT id, id_cliente, hora_cita, estado, servicio_id
    FROM icita
    WHERE id_cliente = %s
    ORDER BY hora_cita DESC
    LIMIT %s
    """
    
    cursor.execute(query, (id_cliente, limit))
    rows = cursor.fetchall()
    
    citas = []
    for row in rows:
        citas.append(Cita(
            id=row['id'],
            id_cliente=row['id_cliente'],
            hora_cita=row['hora_cita'],
            estado=EstadoCita[row['estado'].upper()],
            servicio_id=row['servicio_id']
        ))
    
    cursor.close()
    conn.close()
    
    return citas

async def get_citas_por_negocio(id_negocio: str, limit: int = 100) -> List[CitaDetallada]:
    """
    Obtiene citas de un negocio con información detallada
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        c.id,
        c.id_cliente,
        c.hora_cita,
        c.estado,
        c.servicio_id,
        cl.name as cliente_nombre,
        cl.email as cliente_email,
        s.nombre as servicio_nombre,
        n.nombre as negocio_nombre,
        s.duracion_minutos
    FROM icita c
    INNER JOIN icliente cl ON c.id_cliente = cl.id
    INNER JOIN iservicio s ON c.servicio_id = s.id
    INNER JOIN inegocio n ON s.negocio_id = n.id
    WHERE n.id = %s
    ORDER BY c.hora_cita DESC
    LIMIT %s
    """
    
    cursor.execute(query, (id_negocio, limit))
    rows = cursor.fetchall()
    
    citas = []
    for row in rows:
        citas.append(CitaDetallada(
            id=row['id'],
            id_cliente=row['id_cliente'],
            hora_cita=row['hora_cita'],
            estado=EstadoCita[row['estado'].upper()],
            servicio_id=row['servicio_id'],
            cliente_nombre=row['cliente_nombre'],
            cliente_email=row['cliente_email'],
            servicio_nombre=row['servicio_nombre'],
            negocio_nombre=row['negocio_nombre'],
            duracion_minutos=row.get('duracion_minutos')
        ))
    
    cursor.close()
    conn.close()
    
    return citas

async def get_citas_filtradas(filtro: CitaFiltro, limit: int = 100) -> List[CitaDetallada]:
    """
    Obtiene citas con filtros avanzados
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        c.id,
        c.id_cliente,
        c.hora_cita,
        c.estado,
        c.servicio_id,
        cl.name as cliente_nombre,
        cl.email as cliente_email,
        s.nombre as servicio_nombre,
        n.nombre as negocio_nombre,
        s.duracion_minutos
    FROM icita c
    INNER JOIN icliente cl ON c.id_cliente = cl.id
    INNER JOIN iservicio s ON c.servicio_id = s.id
    INNER JOIN inegocio n ON s.negocio_id = n.id
    WHERE 1=1
    """
    
    params = []
    
    if filtro.id_cliente:
        query += " AND c.id_cliente = %s"
        params.append(filtro.id_cliente)
    
    if filtro.id_negocio:
        query += " AND n.id = %s"
        params.append(filtro.id_negocio)
    
    if filtro.estado:
        query += " AND c.estado = %s"
        params.append(filtro.estado.value)
    
    if filtro.fecha_desde:
        query += " AND c.hora_cita >= %s"
        params.append(filtro.fecha_desde)
    
    if filtro.fecha_hasta:
        query += " AND c.hora_cita <= %s"
        params.append(filtro.fecha_hasta)
    
    query += " ORDER BY c.hora_cita DESC LIMIT %s"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    citas = []
    for row in rows:
        citas.append(CitaDetallada(
            id=row['id'],
            id_cliente=row['id_cliente'],
            hora_cita=row['hora_cita'],
            estado=EstadoCita[row['estado'].upper()],
            servicio_id=row['servicio_id'],
            cliente_nombre=row['cliente_nombre'],
            cliente_email=row['cliente_email'],
            servicio_nombre=row['servicio_nombre'],
            negocio_nombre=row['negocio_nombre'],
            duracion_minutos=row.get('duracion_minutos')
        ))
    
    cursor.close()
    conn.close()
    
    return citas
