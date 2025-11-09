# Generador de PDFs - Sistema de Colas Virtuales

Este servicio genera informes en PDF con los datos del perfil de usuario y resumen de citas.

## Instalación

```bash
pip install -r requirements.txt
```

## Uso desde línea de comandos

```bash
echo '{"usuario": {...}, "resumenCitas": {...}, "outputPath": "salida.pdf"}' | python pdf_generator.py
```

## Estructura de datos de entrada

```json
{
  "usuario": {
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "telefono": "+1234567890",
    "fechaCreacion": "2024-01-15"
  },
  "resumenCitas": {
    "totalCitas": 10,
    "citasCompletadas": 7,
    "citasPendientes": 2,
    "citasCanceladas": 1
  },
  "outputPath": "informe_usuario.pdf"
}
```

## Características

- ✅ Diseño profesional con colores corporativos
- ✅ Tablas con información del usuario
- ✅ Resumen visual de citas con porcentajes
- ✅ Fecha de generación automática
- ✅ Pie de página con información de confidencialidad
