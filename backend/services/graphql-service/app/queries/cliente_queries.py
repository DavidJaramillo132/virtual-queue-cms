from typing import List, Optional
import strawberry
from app.types.cliente_type import Cliente, ClienteDetallado, ClienteFiltro
from app.database.connection import get_db_connection

async def get_clientes(
    filtro: Optional[ClienteFiltro] = None,
    limit: int = 100
) -> List[Cliente]:
    """
    Obtiene lista de clientes con filtros opcionales
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT id, name, apellido, email, telefono, rol FROM icliente WHERE 1=1"
    params = []
    
    if filtro:
        if filtro.email:
            query += " AND email ILIKE %s"
            params.append(f"%{filtro.email}%")
        if filtro.rol:
            query += " AND rol = %s"
            params.append(filtro.rol)
        if filtro.nombre:
            query += " AND name ILIKE %s"
            params.append(f"%{filtro.nombre}%")
    
    query += f" LIMIT %s"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    clientes = []
    for row in rows:
        clientes.append(Cliente(
            id=row['id'],
            name=row['name'],
            apellido=row['apellido'],
            email=row['email'],
            telefono=row.get('telefono'),
            rol=row['rol']
        ))
    
    cursor.close()
    conn.close()
    
    return clientes

async def get_cliente_by_id(id: str) -> Optional[Cliente]:
    """
    Obtiene un cliente por su ID
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT id, name, apellido, email, telefono, rol FROM icliente WHERE id = %s",
        (id,)
    )
    row = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if not row:
        return None
    
    return Cliente(
        id=row['id'],
        name=row['name'],
        apellido=row['apellido'],
        email=row['email'],
        telefono=row.get('telefono'),
        rol=row['rol']
    )

async def get_clientes_detallados(limit: int = 50) -> List[ClienteDetallado]:
    """
    Obtiene clientes con estadísticas detalladas
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT 
        c.id,
        c.name,
        c.apellido,
        c.email,
        c.telefono,
        c.rol,
        COUNT(ci.id) as total_citas,
        COUNT(CASE WHEN ci.estado = 'atendida' THEN 1 END) as citas_completadas,
        COUNT(CASE WHEN ci.estado = 'cancelada' THEN 1 END) as citas_canceladas,
        MAX(ci.hora_cita) as ultima_cita
    FROM icliente c
    LEFT JOIN icita ci ON c.id = ci.id_cliente
    GROUP BY c.id, c.name, c.apellido, c.email, c.telefono, c.rol
    LIMIT %s
    """
    
    cursor.execute(query, (limit,))
    rows = cursor.fetchall()
    
    clientes = []
    for row in rows:
        clientes.append(ClienteDetallado(
            id=row['id'],
            name=row['name'],
            apellido=row['apellido'],
            email=row['email'],
            telefono=row.get('telefono'),
            rol=row['rol'],
            total_citas=row['total_citas'] or 0,
            citas_completadas=row['citas_completadas'] or 0,
            citas_canceladas=row['citas_canceladas'] or 0,
            ultima_cita=row.get('ultima_cita')
        ))
    
    cursor.close()
    conn.close()
    
    return clientes
