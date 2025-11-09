# 🚀 Generador de Informes PDF - Guía de Implementación

## ✅ Implementación Completada

Se ha implementado exitosamente un sistema completo para generar informes PDF con los datos del perfil del usuario desde GraphQL.

## 📁 Estructura de Archivos Creados

### Backend - Generador de PDF (Python)
```
backend/services/pdf-generator/
├── pdf_generator.py      # Generador principal de PDFs
├── requirements.txt      # Dependencias Python
├── test_data.json       # Datos de prueba
└── README.md            # Documentación
```

### Backend - Endpoint REST (TypeScript)
```
backend/services/rest-typescript/src/presentation/
├── controller/
│   └── PdfController.ts  # Nuevo controlador para PDFs
└── routes/
    └── usuarioRoutes.ts  # Actualizado con ruta /informe-pdf
```

### Frontend (Angular)
```
src/app/
├── services/Rest/
│   └── userServices.ts   # Actualizado con método descargarInformePDF()
└── presentation/perfil/
    └── perfil.ts         # Actualizado método ResumenPDF()
```

---

## 🧪 Pruebas

### 1. Probar el Generador de PDF (Python)

```powershell
# Navegar al directorio del generador
cd backend\services\pdf-generator

# Probar con datos de ejemplo
Get-Content test_data.json | python pdf_generator.py
```

Esto debería generar un archivo `test_informe.pdf` en el mismo directorio.

---

### 2. Iniciar los Servicios

#### Terminal 1 - Servicio GraphQL (Python)
```powershell
cd backend\services\GraphQL_Service
python main.py
```
**Debe estar corriendo en:** http://localhost:8000

#### Terminal 2 - Servicio REST (TypeScript)
```powershell
cd backend\services\rest-typescript
npm run dev
```
**Debe estar corriendo en:** http://localhost:3000

#### Terminal 3 - Frontend (Angular)
```powershell
cd frontend\virtual-queue-cms
npm start
```
**Debe estar corriendo en:** http://localhost:4200

---

### 3. Probar desde la Interfaz

1. **Inicia sesión** en la aplicación
2. Ve a tu **perfil de usuario**
3. Haz clic en el botón **"Resumen PDF"** o similar
4. El PDF debería descargarse automáticamente

---

## 🔍 Verificación de Funcionamiento

### El PDF generado debe contener:

✅ **Encabezado profesional** con título y fecha de generación
✅ **Información del usuario:**
   - Nombre completo
   - Email
   - Teléfono
   - Fecha de registro

✅ **Resumen de citas con colores:**
   - Total de citas
   - Citas completadas (verde)
   - Citas pendientes (amarillo)
   - Citas canceladas (rojo)
   - Porcentajes calculados

✅ **Pie de página** con información de confidencialidad

---

## 🐛 Solución de Problemas

### Error: "No se pudo generar el PDF"

**Causa:** Python no encuentra las dependencias

**Solución:**
```powershell
cd backend\services\pdf-generator
pip install reportlab Pillow
```

---

### Error: "Error al obtener datos del usuario"

**Causa:** El servicio GraphQL no está corriendo o no hay token válido

**Soluciones:**
1. Verifica que GraphQL esté en http://localhost:8000
2. Verifica que el token JWT sea válido
3. Revisa que estés autenticado en el frontend

---

### Error: "GRAPHQL_URL is undefined"

**Causa:** Variable de entorno no configurada

**Solución:**
Verifica que `backend/services/rest-typescript/.env` contenga:
```
GRAPHQL_URL=http://localhost:8000/graphql
```

---

### Error de ruta de Python

**Causa:** El path relativo al script de Python puede variar

**Solución:**
Verifica la ruta en `PdfController.ts` línea ~100:
```typescript
const pythonScriptPath = path.join(
    __dirname,
    '../../../../../pdf-generator/pdf_generator.py'
);
```

Si es necesario, ajusta los `../` según tu estructura de carpetas.

---

## 🎨 Personalización del PDF

### Colores Corporativos
Edita en `pdf_generator.py`:
```python
# Línea ~51 - Color del título principal
textColor=colors.HexColor('#1e3a8a')  # Azul oscuro

# Línea ~60 - Color de subtítulos
textColor=colors.HexColor('#2563eb')  # Azul
```

### Agregar Logo de la Empresa
En el método `_add_header()`:
```python
logo = Image('ruta/al/logo.png', width=2*inch, height=1*inch)
self.elements.append(logo)
```

### Agregar Más Secciones
Crea un nuevo método similar a `_add_appointments_summary()`:
```python
def _add_custom_section(self, data: dict):
    # Tu código aquí
    pass
```

Y llámalo en el método `generar()`.

---

## 📊 Flujo de Datos

```
┌─────────────┐      ┌──────────────┐      ┌────────────────┐      ┌──────────────┐
│  Frontend   │─────>│ REST API     │─────>│  GraphQL API   │─────>│  Database    │
│  (Angular)  │      │ (TypeScript) │      │  (Python)      │      │ (PostgreSQL) │
└─────────────┘      └──────────────┘      └────────────────┘      └──────────────┘
      │                      │
      │                      v
      │              ┌──────────────┐
      │              │ PDF Generator│
      │              │   (Python)   │
      │              └──────────────┘
      │                      │
      v                      v
┌─────────────────────────────────┐
│    Descarga automática del PDF  │
└─────────────────────────────────┘
```

---

## 🔐 Seguridad

- ✅ El endpoint está **protegido** con middleware de autenticación
- ✅ Se valida el **token JWT** en cada petición
- ✅ Los archivos temporales se **eliminan automáticamente** después de 5 segundos
- ✅ Solo el usuario autenticado puede generar su propio informe

---

## 📝 API Endpoint

### GET `/api/usuarios/informe-pdf`

**Headers requeridos:**
```
Authorization: Bearer <token_jwt>
```

**Respuesta exitosa:**
- **Status:** 200
- **Content-Type:** application/pdf
- **Body:** Archivo PDF binario

**Errores posibles:**
- **401:** Token no proporcionado o inválido
- **404:** Usuario no encontrado
- **500:** Error al generar el PDF

---

## 🚀 Próximas Mejoras (Opcional)

1. **Agregar gráficos de barras** con las estadísticas de citas
2. **Enviar el PDF por email** en lugar de descargarlo
3. **Agregar historial de citas** en el PDF
4. **Permitir filtros de fecha** para el resumen
5. **Soporte para múltiples idiomas** en el PDF
6. **Firma digital** del documento

---

## 📞 Contacto y Soporte

Si tienes problemas con la implementación:
1. Verifica que todos los servicios estén corriendo
2. Revisa los logs en las consolas de cada servicio
3. Verifica las variables de entorno
4. Confirma que las dependencias estén instaladas

---

## ✨ ¡Listo!

Tu sistema de generación de informes PDF está completamente implementado y listo para usar.

**Comando rápido para iniciar todo:**

```powershell
# Terminal 1
cd backend\services\GraphQL_Service; python main.py

# Terminal 2 (nueva ventana)
cd backend\services\rest-typescript; npm run dev

# Terminal 3 (nueva ventana)
cd frontend\virtual-queue-cms; npm start
```

¡Disfruta generando informes profesionales! 🎉
