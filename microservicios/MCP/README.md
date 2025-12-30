# Microservicio MCP - Virtual Queue CMS

Microservicio de Model Context Protocol que proporciona un asistente de IA con capacidades de gestion de citas, procesamiento de lenguaje natural y herramientas para interactuar con Virtual Queue CMS.

## Caracteristicas

- **Asistente de IA conversacional** con Gemini 1.5 Flash
- **Procesamiento de archivos**: Imagenes (OCR), PDFs, Audio (transcripcion)
- **7 Herramientas MCP** para gestion de citas y negocios
- **API REST** con FastAPI
- **Manejo de contexto** conversacional
- **Integracion con servicios backend** (REST, GraphQL, WebSocket)

## Requisitos Previos

- Docker y Docker Compose
- API Key de Gemini (Google AI) o OpenAI
- Servicios backend corriendo (REST API en puerto 3000)

## Ejecucion con Docker

### 1. Configurar Variables de Entorno

Crear archivo `.env` en el directorio del microservicio:

```env
GEMINI_API_KEY=tu_api_key_aqui
REST_API_URL=http://host.docker.internal:3000/api
GRAPHQL_API_URL=http://host.docker.internal:4000/graphql
WEBSOCKET_URL=ws://host.docker.internal:8080/ws
```

**Nota:** Usar `host.docker.internal` para conectar desde el contenedor a servicios en el host.

### 2. Construir la Imagen

```bash
docker build -t mcp-microservice .
```

### 3. Ejecutar el Contenedor

```bash
docker run -d \
  --name mcp-microservice \
  -p 8000:8000 \
  --env-file .env \
  mcp-microservice
```

### 4. Verificar que esta funcionando

```bash
# Ver logs
docker logs mcp-microservice

# Verificar health
curl http://localhost:8000/health
```

## Docker Compose

Si estas usando docker-compose con otros servicios:

```yaml
version: '3.8'

services:
  mcp-microservice:
    build: ./microservicios/MCP
    container_name: mcp-microservice
    ports:
      - "8000:8000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - REST_API_URL=http://rest-api:3000/api
      - GRAPHQL_API_URL=http://graphql:4000/graphql
      - WEBSOCKET_URL=ws://websocket:8080/ws
    depends_on:
      - rest-api
      - graphql-service
    networks:
      - virtual-queue-network

networks:
  virtual-queue-network:
    driver: bridge
```

## Endpoints

### Principal
- `GET /` - Informacion del servicio
- `GET /health` - Health check
- `GET /api/info` - Capacidades del servicio
- `GET /docs` - Documentacion Swagger
- `GET /redoc` - Documentacion ReDoc

### Chat
- `POST /api/chat` - Interaccion con el asistente
  - **Body (multipart/form-data)**:
    - `message` (string): Mensaje del usuario
    - `file` (file, opcional): Archivo adjunto (imagen, PDF, audio)

## Ejemplo de Uso

### Curl
```bash
# Chat simple
curl -X POST "http://localhost:8000/api/chat" \
  -F "message=Hola, necesito agendar una cita"

# Con archivo
curl -X POST "http://localhost:8000/api/chat" \
  -F "message=Extrae el texto de esta imagen" \
  -F "file=@imagen.jpg"
```

### Python
```python
import requests

response = requests.post(
    "http://localhost:8000/api/chat",
    data={"message": "¿Que negocios estan disponibles?"}
)
print(response.json())
```

## Herramientas Disponibles

El asistente puede usar automaticamente estas herramientas:

1. **ver_horarios_disponibles** - Consulta horarios disponibles
2. **crear_cita** - Crea nuevas citas
3. **cancelar_cita** - Cancela citas
4. **consultar_citas** - Busca citas con filtros
5. **buscar_negocios** - Busca negocios
6. **obtener_servicios** - Lista servicios de un negocio
7. **obtener_info_negocio** - Info detallada de negocio

Ver [documentacion completa de herramientas](app/mcp/herramientas/README.md)

## Estructura del Proyecto

```
MCP/
├── app/
│   ├── main.py                    # Aplicacion FastAPI
│   ├── config.py                  # Configuracion centralizada
│   ├── api/
│   │   └── chat_controller.py     # Controlador de chat
│   ├── llm/
│   │   ├── base_adaptador.py      # Interface base para LLMs
│   │   └── gemini_adapter.py      # Adaptador de Gemini
│   ├── mcp/
│   │   ├── herramientas.py        # Registro de herramientas
│   │   └── herramientas/          # Implementacion de herramientas
│   └── orchestrator/
│       └── ai_orchestrator.py     # Orquestador principal
├── requirements.txt
├── Dockerfile
├── .env.example
└── README.md
```

## Variables de Entorno

| Variable | Descripcion | Requerido | Default |
|----------|-------------|-----------|---------|
| `GEMINI_API_KEY` | API Key de Google Gemini | Si* | - |
| `OPENAI_API_KEY` | API Key de OpenAI | Si* | - |
| `REST_API_URL` | URL del servicio REST | No | `http://localhost:3000/api` |
| `GRAPHQL_API_URL` | URL del servicio GraphQL | No | `http://localhost:4000/graphql` |
| `WEBSOCKET_URL` | URL del WebSocket | No | `ws://localhost:8080/ws` |
| `DEBUG` | Modo debug | No | `False` |
| `LOG_LEVEL` | Nivel de logs | No | `INFO` |
| `API_TIMEOUT` | Timeout de APIs (segundos) | No | `10` |
| `MAX_FILE_SIZE` | Tamano maximo de archivo (bytes) | No | `10485760` |

\* Al menos una de las API keys debe estar configurada

## Comandos Docker Utiles

```bash
# Ver logs en tiempo real
docker logs -f mcp-microservice

# Entrar al contenedor
docker exec -it mcp-microservice /bin/bash

# Detener el contenedor
docker stop mcp-microservice

# Reiniciar el contenedor
docker restart mcp-microservice

# Eliminar el contenedor
docker rm -f mcp-microservice

# Reconstruir imagen
docker build --no-cache -t mcp-microservice .
```

## Troubleshooting

### Error: "GEMINI_API_KEY no esta configurada"
- Verifica que el archivo `.env` existe
- Verifica que la variable esta correctamente escrita
- Reconstruye y reinicia el contenedor

### Error de conexion con REST API
- Usa `host.docker.internal` en lugar de `localhost` en el `.env`
- Verifica que el servicio REST este corriendo
- Verifica que las redes Docker esten configuradas correctamente

### Contenedor se detiene inmediatamente
- Revisa los logs: `docker logs mcp-microservice`
- Verifica que todas las dependencias esten instaladas correctamente

