# 🚀 Virtual Queue CMS - Guía de Docker

## 📋 Requisitos Previos

- Docker instalado (versión 20.10 o superior)
- Docker Compose instalado (versión 2.0 o superior)
- Al menos 4GB de RAM disponible

## 🏗️ Arquitectura de Servicios

El proyecto incluye los siguientes servicios:

1. **postgres-db** (PostgreSQL 16) - Base de datos principal
2. **rest-typescript** - API REST en TypeScript/Node.js (Puerto 3000)
3. **graphql-service** - Servicio GraphQL en Python (Puerto 5000)
4. **websocket-server** - Servidor WebSocket en Go (Puerto 8080)
5. **mcp-service** - Microservicio MCP en Python (Puerto 8001)
6. **frontend** - Aplicación Angular (Puerto 4200)

## 🚀 Cómo Ejecutar

### 1. Configurar Variables de Entorno

Copia el archivo de ejemplo y configura tus variables:

```bash
cp .env.example .env
```

Edita el archivo `.env` y configura:
- `JWT_SECRET`: Tu clave secreta para JWT
- `GEMINI_API_KEY`: Tu API key de Gemini (si usas el servicio MCP)

### 2. Iniciar los Servicios

Para iniciar todos los servicios:

```bash
docker-compose up -d
```

Para ver los logs:

```bash
docker-compose logs -f
```

### 3. Verificar que Todo Está Funcionando

- **Frontend**: http://localhost:4200
- **REST API**: http://localhost:3000
- **GraphQL**: http://localhost:5000
- **WebSocket**: ws://localhost:8080
- **MCP Service**: http://localhost:8001

## 🛠️ Comandos Útiles

### Detener todos los servicios
```bash
docker-compose down
```

### Detener y eliminar volúmenes (⚠️ elimina la base de datos)
```bash
docker-compose down -v
```

### Reconstruir servicios
```bash
docker-compose up -d --build
```

### Ver logs de un servicio específico
```bash
docker-compose logs -f rest-typescript
docker-compose logs -f graphql-service
docker-compose logs -f frontend
```

### Reiniciar un servicio específico
```bash
docker-compose restart rest-typescript
```

### Acceder a la base de datos
```bash
docker exec -it postgres-db psql -U postgres -d virtual_queue
```

### Ejecutar comandos dentro de un contenedor
```bash
docker exec -it rest-typescript sh
docker exec -it graphql-service bash
```

## 🔧 Desarrollo

### Hot Reload

Todos los servicios están configurados con hot reload para desarrollo:
- Los cambios en el código se reflejarán automáticamente
- No necesitas reconstruir los contenedores para cada cambio

### Estructura de Volúmenes

Los siguientes directorios están montados como volúmenes:
- `./backend/services/rest-typescript` → `/app`
- `./backend/services/GraphQL_Service` → `/app`
- `./microservicios/MCP/app` → `/app`
- `./frontend/virtual-queue-cms` → `/app`

## 📊 Base de Datos

La base de datos se inicializa automáticamente con el script `baseDatos.sql` al primer arranque.

### Backup de la Base de Datos
```bash
docker exec postgres-db pg_dump -U postgres virtual_queue > backup.sql
```

### Restaurar Base de Datos
```bash
cat backup.sql | docker exec -i postgres-db psql -U postgres virtual_queue
```

## 🐛 Solución de Problemas

### Los puertos están en uso
Si algún puerto está en uso, modifica el mapeo en `docker-compose.yml`:
```yaml
ports:
  - "NUEVO_PUERTO:PUERTO_INTERNO"
```

### Error de conexión a la base de datos
Asegúrate de que el servicio de PostgreSQL esté healthy:
```bash
docker-compose ps
```

### Limpiar todo y empezar de nuevo
```bash
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

## 📝 Notas Importantes

- La primera vez que ejecutes el proyecto, la descarga de imágenes y la construcción puede tardar varios minutos
- Asegúrate de tener suficiente espacio en disco (al menos 5GB)
- Los datos de PostgreSQL se persisten en un volumen Docker llamado `postgres-data`

## 🔒 Seguridad

⚠️ **IMPORTANTE**: Las credenciales por defecto son solo para desarrollo. 

En producción debes:
1. Cambiar todas las contraseñas
2. Usar secrets de Docker
3. Configurar HTTPS
4. Usar un JWT_SECRET fuerte
