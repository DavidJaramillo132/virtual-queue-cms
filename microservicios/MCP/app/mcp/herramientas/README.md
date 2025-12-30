# Herramientas MCP

Este directorio contiene las herramientas MCP (Model Context Protocol) que permiten al asistente de IA interactuar con el sistema Virtual Queue CMS.

## 📚 Herramientas Disponibles

### 1. **Ver Horarios Disponibles** (`ver_horarios_disponibles`)
Obtiene los horarios disponibles para agendar una cita en un negocio específico.

**Parámetros:**
- `negocio_id` (requerido): ID del negocio
- `servicio_id` (opcional): ID del servicio específico
- `fecha` (opcional): Fecha en formato YYYY-MM-DD
- `estacion_id` (opcional): ID de la estación

**Ejemplo:**
```json
{
  "negocio_id": "uuid-del-negocio",
  "fecha": "2025-12-28",
  "servicio_id": "uuid-del-servicio"
}
```

---

### 2. **Crear Cita** (`crear_cita`)
Crea una nueva cita en el sistema.

**Parámetros requeridos:**
- `cliente_id`: ID del cliente
- `negocio_id`: ID del negocio
- `servicio_id`: ID del servicio
- `estacion_id`: ID de la estación
- `fecha`: Fecha en formato YYYY-MM-DD
- `hora_inicio`: Hora de inicio (HH:MM)
- `hora_fin`: Hora de fin (HH:MM)

**Ejemplo:**
```json
{
  "cliente_id": "uuid-del-cliente",
  "negocio_id": "uuid-del-negocio",
  "servicio_id": "uuid-del-servicio",
  "estacion_id": "uuid-de-estacion",
  "fecha": "2025-12-28",
  "hora_inicio": "10:00",
  "hora_fin": "11:00"
}
```

---

### 3. **Cancelar Cita** (`cancelar_cita`)
Cancela una cita existente.

**Parámetros:**
- `cita_id` (requerido): ID de la cita a cancelar
- `motivo` (opcional): Motivo de la cancelación

**Ejemplo:**
```json
{
  "cita_id": "uuid-de-la-cita",
  "motivo": "Cambio de planes"
}
```

---

### 4. **Consultar Citas** (`consultar_citas`)
Consulta citas con filtros opcionales.

**Parámetros (todos opcionales):**
- `cliente_id`: ID del cliente
- `negocio_id`: ID del negocio
- `estado`: Estado (pendiente, atendida, cancelada)
- `fecha_inicio`: Inicio del rango de fechas
- `fecha_fin`: Fin del rango de fechas

**Ejemplo:**
```json
{
  "cliente_id": "uuid-del-cliente",
  "estado": "pendiente",
  "fecha_inicio": "2025-12-01",
  "fecha_fin": "2025-12-31"
}
```

---

### 5. **Buscar Negocios** (`buscar_negocios`)
Busca negocios en el sistema.

**Parámetros (todos opcionales):**
- `nombre`: Nombre del negocio
- `categoria`: Categoría del negocio
- `estado`: Estado (true/false)
- `limite`: Número máximo de resultados

**Ejemplo:**
```json
{
  "nombre": "Barbería",
  "categoria": "belleza",
  "estado": true
}
```

---

### 6. **Obtener Servicios** (`obtener_servicios`)
Obtiene los servicios de un negocio.

**Parámetros:**
- `negocio_id` (requerido): ID del negocio
- `nombre` (opcional): Filtrar por nombre

**Ejemplo:**
```json
{
  "negocio_id": "uuid-del-negocio",
  "nombre": "Corte"
}
```

---

### 7. **Obtener Info de Negocio** (`obtener_info_negocio`)
Obtiene información detallada de un negocio.

**Parámetros:**
- `negocio_id` (requerido): ID del negocio

**Ejemplo:**
```json
{
  "negocio_id": "uuid-del-negocio"
}
```

---

## 🔧 Configuración

Las herramientas utilizan la configuración centralizada en `app/config.py`. Asegúrate de configurar las siguientes variables de entorno:

```bash
REST_API_URL=http://localhost:3000/api
GRAPHQL_API_URL=http://localhost:4000/graphql
WEBSOCKET_URL=ws://localhost:8080/ws
```

## 🏗️ Estructura

```
herramientas/
├── __init__.py                      # Exporta todas las herramientas
├── ver_horarios_disponibles.py     # Ver horarios disponibles
├── crear_cita.py                    # Crear nueva cita
├── cancelar_cita.py                 # Cancelar cita existente
├── consultar_citas.py               # Consultar citas con filtros
├── buscar_negocios.py               # Buscar negocios
├── obtener_servicios.py             # Obtener servicios de un negocio
└── obtener_info_negocio.py          # Obtener info detallada de negocio
```

## 🔄 Flujo de Ejecución

1. El usuario envía un mensaje al asistente
2. El LLM analiza el mensaje y determina si necesita usar herramientas
3. El orquestrador ejecuta las herramientas necesarias
4. Las herramientas hacen llamadas HTTP al servicio REST
5. Los resultados se retornan al LLM
6. El LLM genera una respuesta natural para el usuario

## 📝 Agregar Nuevas Herramientas

Para agregar una nueva herramienta:

1. Crea un nuevo archivo en `app/mcp/herramientas/`
2. Define una función async que reciba `data: Dict[str, Any]`
3. Implementa la lógica de la herramienta
4. Retorna un diccionario con `{"exito": bool, ...}`
5. Exporta la función en `__init__.py`
6. Agrega la definición en `herramientas.py`
7. El orquestador la detectará automáticamente

## ⚠️ Notas Importantes

- Todas las herramientas son **asíncronas** (`async`)
- Usan **httpx** para llamadas HTTP
- Implementan **manejo de errores** robusto
- Retornan siempre un diccionario con campo `exito`
- Validan parámetros requeridos antes de ejecutar
- Usan timeouts para evitar bloqueos
