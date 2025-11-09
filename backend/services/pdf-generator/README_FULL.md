# 📄 Sistema de Generación de Informes PDF

## Resumen

Este sistema permite generar informes PDF profesionales con los datos del perfil del usuario y el resumen de sus citas, integrando los servicios GraphQL, REST y un generador de PDF en Python.

## 🏗️ Arquitectura

```
Frontend (Angular)
    ↓ HTTP GET /api/usuarios/informe-pdf
REST API (TypeScript/Node.js)
    ↓ GraphQL Query
GraphQL API (Python/Strawberry)
    ↓ Database Query
PostgreSQL (Supabase)
    ↑ User Data + Appointments
GraphQL API
    ↑ JSON Response
REST API
    ↓ Spawn Python Process
PDF Generator (Python/ReportLab)
    ↑ PDF Binary
REST API
    ↑ PDF Stream
Frontend
    ↓ Auto Download
User's Computer
```

## 📋 Características

- ✅ Generación de PDF con datos en tiempo real desde GraphQL
- ✅ Diseño profesional con tablas y colores corporativos
- ✅ Resumen visual de citas con porcentajes
- ✅ Descarga automática desde el navegador
- ✅ Archivos temporales con auto-eliminación
- ✅ Autenticación y seguridad con JWT
- ✅ Manejo de errores robusto

## 🛠️ Tecnologías

### Backend
- **Python 3.x** - Generador de PDF
- **ReportLab** - Librería para creación de PDFs
- **Node.js + TypeScript** - REST API
- **Strawberry GraphQL** - API GraphQL
- **Axios** - Cliente HTTP

### Frontend
- **Angular 18+** - Framework frontend
- **HttpClient** - Cliente HTTP de Angular

## 📦 Instalación

### 1. Dependencias Python
```bash
cd backend/services/pdf-generator
pip install reportlab Pillow
```

### 2. Dependencias Node.js
```bash
cd backend/services/rest-typescript
npm install axios
```

### 3. Variables de Entorno
Asegúrate de tener en `backend/services/rest-typescript/.env`:
```env
GRAPHQL_URL=http://localhost:8000/graphql
```

## 🚀 Uso

### Desde la Interfaz
1. Inicia sesión en la aplicación
2. Navega a tu perfil
3. Haz clic en el botón "Resumen PDF"
4. El PDF se descargará automáticamente

### Desde la API
```bash
curl -X GET http://localhost:3000/api/usuarios/informe-pdf \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output informe.pdf
```

### Prueba del Generador Python
```bash
cd backend/services/pdf-generator
Get-Content test_data.json | python pdf_generator.py
```

## 📊 Estructura del PDF

1. **Encabezado**
   - Título del informe
   - Fecha de generación

2. **Información Personal**
   - Nombre completo
   - Email
   - Teléfono
   - Fecha de registro

3. **Resumen de Citas**
   - Total de citas
   - Citas completadas (verde)
   - Citas pendientes (amarillo)
   - Citas canceladas (rojo)
   - Porcentajes calculados

4. **Pie de Página**
   - Información de confidencialidad

## 🔧 Configuración

### Personalizar Colores
En `pdf_generator.py`, método `_setup_custom_styles()`:
```python
textColor=colors.HexColor('#1e3a8a')  # Tu color
```

### Agregar Logo
En `pdf_generator.py`, método `_add_header()`:
```python
logo = Image('path/to/logo.png', width=2*inch, height=1*inch)
self.elements.append(logo)
```

## 🐛 Troubleshooting

### Error: "Module not found: reportlab"
```bash
pip install reportlab Pillow
```

### Error: "GRAPHQL_URL is undefined"
Verifica que `.env` tenga la variable configurada.

### Error: "Token no proporcionado"
Asegúrate de estar autenticado y que el token sea válido.

### Error de ruta Python
Ajusta el path en `PdfController.ts`:
```typescript
const pythonScriptPath = path.join(
    __dirname,
    '../../../../../pdf-generator/pdf_generator.py'
);
```

## 📁 Archivos Modificados/Creados

### Nuevos
- `backend/services/pdf-generator/pdf_generator.py`
- `backend/services/pdf-generator/requirements.txt`
- `backend/services/pdf-generator/test_data.json`
- `backend/services/rest-typescript/src/presentation/controller/PdfController.ts`

### Modificados
- `backend/services/rest-typescript/src/presentation/routes/usuarioRoutes.ts`
- `backend/services/rest-typescript/.env`
- `frontend/virtual-queue-cms/src/app/services/Rest/userServices.ts`
- `frontend/virtual-queue-cms/src/app/presentation/perfil/perfil.ts`

## 🔐 Seguridad

- ✅ Endpoint protegido con `authMiddleware`
- ✅ Validación de token JWT
- ✅ Los archivos temporales se eliminan después de 5 segundos
- ✅ Solo el usuario autenticado puede ver su informe

## 🎯 Próximas Mejoras

- [ ] Agregar gráficos de barras/pastel
- [ ] Envío de PDF por email
- [ ] Historial detallado de citas
- [ ] Filtros por rango de fechas
- [ ] Soporte multiidioma
- [ ] Firma digital del documento
- [ ] Caché de PDFs generados
- [ ] Conversión a PNG/JPG

## 📝 Licencia

Este proyecto es parte del Sistema de Gestión de Colas Virtuales.

## 👨‍💻 Autor

Desarrollado para Virtual Queue CMS

---

**Última actualización:** Noviembre 2025
