"""
Herramienta MCP para crear un negocio en el sistema.
Permite crear negocios con su usuario administrador asociado.
"""

import httpx
from typing import Dict, Any
from app.config import config


async def crear_negocio(parametros: Dict[str, Any]) -> Dict[str, Any]:
    """
    Crea un nuevo negocio en el sistema con su usuario administrador.
    
    Args:
        parametros: Diccionario con los datos del negocio y usuario:
            - nombre (str, requerido): Nombre del negocio
            - categoria (str, requerido): Categoría del negocio (ej: "Salud", "Belleza", "Consultoría")
            - descripcion (str, opcional): Descripción detallada del negocio
            - telefono (str, opcional): Teléfono de contacto del negocio
            - correo (str, opcional): Correo electrónico del negocio
            - direccion (str, opcional): Dirección física
            - horario_general (str, opcional): Horario de atención (ej: "Lun-Vie 9:00-18:00")
            
            Información del administrador:
            - admin_nombre (str, requerido): Nombre completo del administrador
            - admin_email (str, requerido): Email del administrador (para login)
            - admin_telefono (str, opcional): Teléfono del administrador
            - admin_password (str, opcional): Contraseña (si no se proporciona, se usa el email)
    
    Returns:
        Dict con el resultado de la creación del negocio y usuario
    """
    try:
        # Validar parámetros requeridos del negocio
        if "nombre" not in parametros or not parametros["nombre"]:
            return {
                "exito": False,
                "error": "El nombre del negocio es requerido"
            }
        
        if "categoria" not in parametros or not parametros["categoria"]:
            return {
                "exito": False,
                "error": "La categoría del negocio es requerida"
            }
        
        # Validar parámetros del administrador
        if "admin_nombre" not in parametros or not parametros["admin_nombre"]:
            return {
                "exito": False,
                "error": "El nombre del administrador es requerido"
            }
        
        if "admin_email" not in parametros or not parametros["admin_email"]:
            return {
                "exito": False,
                "error": "El email del administrador es requerido"
            }
        
        base_url = config.REST_API_URL
        
        async with httpx.AsyncClient() as client:
            # Paso 1: Crear el usuario administrador
            # La contraseña se envía sin hashear, el API REST la hasheará con bcrypt
            password = parametros.get("admin_password", parametros["admin_email"])
            
            usuario_payload = {
                "email": parametros["admin_email"],
                "password": password,  # Enviar sin hashear, el backend lo hasheará
                "rol": "negocio",
                "nombre_completo": parametros["admin_nombre"],
                "telefono": parametros.get("admin_telefono", "")
            }
            
            print(f"👤 Creando usuario: {parametros['admin_email']}")
            
            try:
                usuario_response = await client.post(
                    f"{base_url}/usuarios",
                    json=usuario_payload,
                    timeout=10.0
                )
                usuario_response.raise_for_status()
                response_data = usuario_response.json()
                
                # El API puede retornar el usuario directamente o en un objeto "user"
                if "user" in response_data:
                    usuario = response_data["user"]
                elif "id" in response_data:
                    usuario = response_data
                else:
                    return {
                        "exito": False,
                        "error": f"Error al crear usuario: La respuesta del servidor no tiene el formato esperado. Respuesta: {response_data}"
                    }
                
                print(f"✅ Usuario creado: {usuario.get('id')} - {usuario.get('email')}")
                
            except httpx.HTTPError as e:
                error_detail = ""
                try:
                    if hasattr(e, 'response') and e.response is not None:
                        error_detail = e.response.json()
                    else:
                        error_detail = str(e)
                except:
                    error_detail = str(e)
                
                return {
                    "exito": False,
                    "error": f"Error al crear usuario administrador: {error_detail}"
                }
            
            # Paso 2: Crear el negocio asociado al usuario
            negocio_payload = {
                "nombre": parametros["nombre"],
                "categoria": parametros["categoria"],
                "descripcion": parametros.get("descripcion", ""),
                "telefono": parametros.get("telefono", ""),
                "correo": parametros.get("correo", ""),
                "direccion": parametros.get("direccion", ""),
                "horario_general": parametros.get("horario_general", ""),
                "admin_negocio_id": usuario["id"],
                "estado": True
            }
            
            print(f"📝 Creando negocio con payload: {negocio_payload}")
            
            try:
                negocio_response = await client.post(
                    f"{base_url}/negocios",
                    json=negocio_payload,
                    timeout=10.0
                )
                negocio_response.raise_for_status()
                negocio = negocio_response.json()
                
                print(f"✅ Negocio creado exitosamente: {negocio.get('id')}")
                
                return {
                    "exito": True,
                    "mensaje": f"Negocio '{parametros['nombre']}' y usuario administrador creados exitosamente",
                    "negocio": negocio,
                    "usuario": {
                        "id": usuario["id"],
                        "email": usuario["email"],
                        "nombre_completo": usuario.get("nombre_completo", parametros["admin_nombre"])
                    },
                    "credenciales": {
                        "email": usuario["email"],
                        "password_temporal": password
                    }
                }
            
            except httpx.HTTPError as e:
                error_detail = ""
                try:
                    if hasattr(e, 'response') and e.response is not None:
                        error_detail = e.response.json()
                    else:
                        error_detail = str(e)
                except:
                    error_detail = str(e)
                
                return {
                    "exito": False,
                    "error": f"Error al crear el negocio (usuario sí fue creado): {error_detail}. Usuario ID: {usuario['id']}"
                }
        
    except httpx.HTTPError as e:
        error_detail = ""
        try:
            error_detail = e.response.json() if hasattr(e, 'response') and e.response else str(e)
        except:
            error_detail = str(e)
        
        return {
            "exito": False,
            "error": f"Error de conexión: {error_detail}"
        }
    except Exception as e:
        return {
            "exito": False,
            "error": f"Error inesperado: {str(e)}"
        }


# Definición de la herramienta para el LLM
DEFINICION_HERRAMIENTA = {
    "name": "crear_negocio",
    "description": """Crea un nuevo negocio en el sistema junto con su usuario administrador.
    Usa esta herramienta cuando el usuario quiera registrar un nuevo negocio.
    
    Información requerida del negocio:
    - Nombre del negocio
    - Categoría (Salud, Belleza, Consultoría, Restaurante, etc.)
    
    Información requerida del administrador:
    - Nombre completo del administrador/propietario
    - Email del administrador (se usará para login)
    
    Información opcional pero recomendada:
    - Descripción del negocio
    - Teléfono del negocio
    - Correo del negocio
    - Dirección
    - Horario general
    - Teléfono del administrador
    - Contraseña del administrador (si no se proporciona, se usa el email)""",
    "parameters": {
        "type": "object",
        "properties": {
            "nombre": {
                "type": "string",
                "description": "Nombre del negocio"
            },
            "categoria": {
                "type": "string",
                "description": "Categoría del negocio (ej: Salud, Belleza, Consultoría, Restaurante, Tecnología, etc.)"
            },
            "descripcion": {
                "type": "string",
                "description": "Descripción detallada del negocio y sus servicios"
            },
            "telefono": {
                "type": "string",
                "description": "Número de teléfono del negocio"
            },
            "correo": {
                "type": "string",
                "description": "Correo electrónico del negocio"
            },
            "direccion": {
                "type": "string",
                "description": "Dirección física del negocio"
            },
            "horario_general": {
                "type": "string",
                "description": "Horario de atención general (ej: 'Lunes a Viernes 9:00-18:00')"
            },
            "admin_nombre": {
                "type": "string",
                "description": "Nombre completo del administrador/propietario del negocio"
            },
            "admin_email": {
                "type": "string",
                "description": "Email del administrador (se usará como usuario para login)"
            },
            "admin_telefono": {
                "type": "string",
                "description": "Teléfono personal del administrador"
            },
            "admin_password": {
                "type": "string",
                "description": "Contraseña para la cuenta del administrador (opcional, si no se proporciona se usa el email)"
            }
        },
        "required": ["nombre", "categoria", "admin_nombre", "admin_email"]
    }
}
