# 🗂️ Índice de Documentación - WebSocket Server

## 📖 Documentos Disponibles

### 1. **ARQUITECTURA.md** (Inicio aquí)
**Contenido**: Explicación completa y conceptual del sistema

- Visión general del WebSocket Server
- Arquitectura del sistema (diagrama)
- Estructura de carpetas y componentes
- Flujo de datos paso a paso
- Conexión front-end
- Integración con Angular
- Ejemplo práctico completo
- Troubleshooting

**Para quién**: Todos. Empieza por aquí para entender qué es y cómo funciona.

**Tiempo de lectura**: 15-20 minutos

---

### 2. **GUIA_PRACTICA.md** (Usar para implementar)
**Contenido**: Guía práctica con código ejecutable

- Instalación y configuración paso a paso
- Ejemplos de código en TypeScript y Go
- Múltiples casos de uso
- Debugging y troubleshooting
- Performance y optimizaciones
- Despliegue en producción con Docker

**Para quién**: Desarrolladores que necesitan implementar o debuggear.

**Tiempo de lectura**: 10-15 minutos + tiempo de implementación

---

### 3. **INTEGRACION_REST_API.md** (REST API + WebSocket)
**Contenido**: Cómo integra el WebSocket con el REST API

- Arquitectura de integración
- WebSocketNotificationService
- Flujo completo de eventos
- Notificaciones paso a paso
- Secuencia de eventos real
- Variables de entorno
- Endpoints disponibles
- Testing e integración

**Para quién**: Desarrolladores del REST API que necesitan notificar cambios.

**Tiempo de lectura**: 10-12 minutos

---

## 🎯 Rutas Rápidas por Caso de Uso

### "Quiero entender qué es el WebSocket Server"
1. Lee: **ARQUITECTURA.md** → Sección "Visión General"
2. Lee: **ARQUITECTURA.md** → Sección "Arquitectura del Sistema"
3. Resultado: Entenderás qué es y para qué sirve

**Tiempo**: 5 minutos

---

### "Quiero ejecutar el servidor localmente"
1. Lee: **GUIA_PRACTICA.md** → Sección "Instalación y Configuración"
2. Ejecuta comandos de instalación
3. Verifica que funciona
4. Resultado: Servidor corriendo en puerto 8080

**Tiempo**: 10 minutos

---

### "Quiero conectar desde Angular"
1. Lee: **ARQUITECTURA.md** → Sección "Conexión Front-End"
2. Copia código de: **GUIA_PRACTICA.md** → Sección "Ejemplo 1: Conectar desde Angular"
3. Implementa en tu componente
4. Resultado: Datos en tiempo real en tu dashboard

**Tiempo**: 15 minutos

---

### "Quiero debuggear por qué no funciona"
1. Lee: **GUIA_PRACTICA.md** → Sección "Debugging"
2. Sigue los pasos de troubleshooting
3. Verifica logs del servidor
4. Resultado: Identificarás el problema

**Tiempo**: 10 minutos (+ tiempo de fix)

---

### "Quiero integrar con REST API"
1. Lee: **INTEGRACION_REST_API.md** → Completo
2. Implementa WebSocketNotificationService en CitaController
3. Verifica notificaciones en WebSocket Server
4. Resultado: REST API notifica cambios en tiempo real

**Tiempo**: 20-30 minutos

---

### "Quiero entender los componentes internos"
1. Lee: **ARQUITECTURA.md** → Sección "Componentes Principales"
2. Lee cada subsección (Handler, Hub, Cliente, etc.)
3. Consulta archivos .go correspondientes
4. Resultado: Entenderás cómo funciona internamente

**Tiempo**: 25-30 minutos

---

## 📁 Estructura de Archivos

```
websocket-server/
├── README.md                          ← Te traerá aquí
├── INDICE.md                          ← Este archivo
├── ARQUITECTURA.md                    ← Explicación conceptual
├── GUIA_PRACTICA.md                   ← Guía con ejemplos
├── INTEGRACION_REST_API.md            ← Integración REST
├── cmd/
│   └── main.go                        ← Punto de entrada
├── internal/
│   ├── handlers/websocket.go          ← Maneja conexiones
│   ├── hub/
│   │   ├── hub.go                     ← Centro de control
│   │   └── client.go                  ← Comunicación
│   ├── models/message.go              ← Estructuras
│   ├── services/estadisticas_service.go
│   └── utils/auth.go                  ← Validación JWT
├── .env                               ← Variables de entorno
├── go.mod                             ← Dependencias
└── Dockerfile                         ← Para Docker
```

---

## 🔑 Conceptos Clave

### WebSocket
- Protocolo que permite comunicación bidireccional
- Conexión persistente (no como HTTP que cierra)
- Ideal para datos en tiempo real

### Hub
- Centro de control del servidor
- Gestiona todas las conexiones de clientes
- Distribuye mensajes a canales

### Canal (Channel)
- Forma de organizar suscripciones
- Ej: `estadisticas:negocio_123`
- Cada negocio recibe solo sus datos

### Goroutine
- Thread ligero de Go
- Muy eficiente para I/O (WebSocket)
- Cientos de miles corren sin problema

### JWT (JSON Web Token)
- Token para autenticación
- Valida que el usuario sea quien dice ser
- Se envía en la URL: `ws://...?token=JWT`

---

## 🚀 Quick Start (5 minutos)

```bash
# 1. Ir a directorio
cd backend/services/websocket-server

# 2. Crear .env (copiar de plantilla)
cp .env.example .env
# Editar con tus credenciales

# 3. Instalar dependencias
go mod download

# 4. Ejecutar
cd cmd
go run main.go

# 5. Verificar en navegador
# Abre DevTools (F12) y:
# ws://localhost:8080/ws?token=TOKEN_VALIDO
```

**Esperado**: Conexión establecida, sin errores

---

## 🔗 Diagrama de Relación de Documentos

```
START
  │
  ├──> Nuevo? ─────> ARQUITECTURA.md ────> Entiendes qué es
  │
  ├──> Implementar? ─> GUIA_PRACTICA.md ──> Tienes código
  │
  └──> REST API? ────> INTEGRACION_REST_API.md ──> Sabes integrar
```

---

## 📞 Preguntas Frecuentes Rápidas

**P: ¿En qué puerto corre?**
R: Puerto 8080. Configurable en main.go

**P: ¿Qué base de datos usa?**
R: PostgreSQL (Supabase). URL en .env

**P: ¿Cómo autentico?**
R: Con JWT. Token en query parameter: `?token=JWT`

**P: ¿Puedo tener múltiples clientes?**
R: Sí. Hub soporta cientos simultáneamente

**P: ¿Qué pasa si se cae el servidor?**
R: Frontend reconecta automáticamente. RxJS lo maneja

**P: ¿Puedo usar para otras cosas?**
R: Sí. Modifica los canales y tipos de mensaje

---

## 🎓 Curva de Aprendizaje

| Nivel | Documentos | Tiempo |
|-------|-----------|--------|
| Básico | README.md + ARQUITECTURA.md | 30 min |
| Intermedio | + GUIA_PRACTICA.md | 1-2 horas |
| Avanzado | + INTEGRACION_REST_API.md + código | 2-4 horas |
| Expert | Todo + debuggear y optimizar | 5+ horas |

---

## ✅ Checklist de Comprensión

Después de leer los documentos, deberías entender:

- [ ] Qué es un WebSocket y por qué se usa
- [ ] Arquitectura general del servidor
- [ ] Cómo se conectan clientes
- [ ] Cómo funciona el Hub
- [ ] Qué son los canales
- [ ] Cómo funcionan Goroutines
- [ ] Cómo autentica con JWT
- [ ] Cómo se integra con REST API
- [ ] Cómo debuggear problemas
- [ ] Cómo deployar en producción

---

## 🔄 Flujo Típico de Aprendizaje

```
1. Lee ARQUITECTURA.md (30 min)
   └─> Entiende conceptos

2. Lee GUIA_PRACTICA.md (15 min)
   └─> Entiende cómo implementar

3. Ejecuta servidor localmente (10 min)
   └─> Verifica que funciona

4. Conecta desde Angular (15 min)
   └─> Ves datos en tiempo real

5. Lee INTEGRACION_REST_API.md (10 min)
   └─> Entiende notificaciones

6. Implementa notificaciones (20 min)
   └─> Rest API notifica cambios

7. Debuggea problemas (según sea necesario)
   └─> Usa guía de troubleshooting

Total: 2-3 horas de aprendizaje completo
```

---

## 🎯 Próximos Pasos Sugeridos

1. **Corto plazo**
   - [ ] Leer ARQUITECTURA.md
   - [ ] Ejecutar servidor localmente
   - [ ] Conectar desde Angular

2. **Mediano plazo**
   - [ ] Implementar WebSocketNotificationService
   - [ ] Probar notificaciones end-to-end
   - [ ] Debuggear problemas

3. **Largo plazo**
   - [ ] Deployar en producción
   - [ ] Optimizar performance
   - [ ] Agregar nuevos canales/tipos de mensaje

---

## 💡 Tips Importantes

✅ **Lee en orden**: ARQUITECTURA → GUIA_PRACTICA → INTEGRACION

✅ **Comparte referencia**: Cuando alguien no entienda, apunta a ARQUITECTURA.md

✅ **Experimenta**: Modifica codigo y experimenta

✅ **Debug activamente**: Usa DevTools y logs para entender qué pasa

✅ **No memorices**: Entiende conceptos, el código está documentado

---

**Última actualización**: 2025-11-10  
**Versión**: 1.0
