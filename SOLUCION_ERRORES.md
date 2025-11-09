# 🔧 Solución de Errores - Guía Rápida

## ✅ Cambios Aplicados

### 1. **PdfController.ts**
- ✅ Corregido nombre del archivo Python: `pdf_generator.py` (antes era incorrecto)
- ✅ Agregado campo `fechaCreacion` en el query de GraphQL
- ✅ Agregado formateo de fecha en español
- ✅ Agregados logs para debugging

### 2. **perfil.html**
- ✅ Mejorado botón "Descargar Informe PDF" con diseño profesional
- ✅ Agregado ícono de descarga
- ✅ Agregado spinner de carga animado
- ✅ Deshabilitado durante la generación

---

## 🚀 Cómo Probar Ahora

### Paso 1: Reiniciar el Servidor REST (TypeScript)
```powershell
# En la terminal donde corre el servidor REST
Ctrl + C   # Detener el servidor
npm run dev   # Reiniciar
```

### Paso 2: Refrescar el Frontend
En el navegador, presiona `Ctrl + F5` para recargar sin caché.

### Paso 3: Probar la Funcionalidad
1. Ve a tu perfil
2. Haz clic en el botón **"Descargar Informe PDF"** (botón rojo al final de "Resumen de Citas")
3. El PDF debería descargarse automáticamente

---

## 🐛 Si Aún Hay Errores

### Error: "Cannot find module 'axios'"
```powershell
cd backend\services\rest-typescript
npm install axios
```

### Error: "Python no reconocido"
Verifica que Python esté instalado:
```powershell
python --version
```

### Error: "Module 'reportlab' not found"
```powershell
pip install reportlab Pillow
```

### Error: GraphQL no responde
Verifica que el servicio GraphQL esté corriendo:
```powershell
cd backend\services\GraphQL_Service
python main.py
```
Debe estar en `http://localhost:8000`

### Ver logs del servidor REST
Revisa la terminal donde corre el servidor REST (puerto 3000). Debería mostrar:
- Ruta del script Python
- Datos enviados al PDF
- Cualquier error de GraphQL

---

## 🔍 Verificar Ruta del Script Python

Si sigue fallando, verifica la ruta manualmente:

```powershell
# Desde el directorio del proyecto
cd backend\services\rest-typescript\src\presentation\controller
# Desde aquí, el script debería estar en:
cd ..\..\..\..\pdf-generator
# Debería existir: pdf_generator.py
```

Si la ruta no coincide, ajusta en `PdfController.ts` línea ~100:
```typescript
const pythonScriptPath = path.join(
    __dirname,
    '../../../../pdf-generator/pdf_generator.py'  // Ajustar según tu estructura
);
```

---

## 📊 Estructura Esperada

```
backend/
├── services/
│   ├── GraphQL_Service/       → Puerto 8000
│   ├── rest-typescript/       → Puerto 3000
│   │   ├── src/
│   │   │   └── presentation/
│   │   │       └── controller/
│   │   │           └── PdfController.ts
│   │   └── temp/              → Se crea automáticamente
│   └── pdf-generator/
│       └── pdf_generator.py
```

---

## ✅ Checklist de Verificación

- [ ] Servicio GraphQL corriendo en puerto 8000
- [ ] Servicio REST corriendo en puerto 3000
- [ ] Frontend corriendo en puerto 4200
- [ ] Usuario autenticado (token válido)
- [ ] Dependencies Python instaladas (reportlab, Pillow)
- [ ] Axios instalado en el proyecto TypeScript
- [ ] Variable GRAPHQL_URL en .env

---

## 🎯 Comando para Ver Logs en Tiempo Real

En la terminal del servidor REST, ahora verás:
```
Ruta del script Python: C:\...\pdf-generator\pdf_generator.py
Datos a enviar al PDF: {
  "usuario": { ... },
  "resumenCitas": { ... },
  "outputPath": "..."
}
```

Si ves estos logs, significa que la petición llega correctamente al controlador.

---

## 💡 Prueba Manual del Generador

Para verificar que el generador Python funciona:
```powershell
cd backend\services\pdf-generator
Get-Content test_data.json | python pdf_generator.py
```

Debería generar `test_informe.pdf` exitosamente.

---

¡Reinicia el servidor REST y prueba de nuevo! 🚀
