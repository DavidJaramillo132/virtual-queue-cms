---
applyTo: 'rules'
---
# Reglas de Programación con IA y Humanos

##  Reglas Fundamentales

### Idioma y Comunicación

- *TODO* debe estar en español: código, variables, funciones, comentarios, commits, documentación
- Nombres descriptivos y claros (evitar abreviaciones confusas)
- Comentarios solo cuando añadan valor real (no redundantes) y evitar colocar iconos tanto en comantarios como en código

### Principios de Código Limpio

- *SOLID*: Responsabilidad única, Abierto/Cerrado, Sustitución de Liskov, Segregación de interfaces, Inversión de dependencias
- *DRY*: No repetir código (Don't Repeat Yourself)
- *KISS*: Mantener simple (Keep It Simple, Stupid)
- *YAGNI*: No implementar hasta que se necesite (You Aren't Gonna Need It)

### Estructura y Organización

- *Todo los archivos modular* → dividir en módulos si se excede
- *Separación clara*: backend/ frontend/ shared/ docs/ tests/
- *Un archivo = Una responsabilidad*
- *Carpetas por funcionalidad*, no por tipo de archivo

##  Estándares por Tecnología

## TypeScript/JavaScript

### Nomenclatura

typescript
//  Correcto
const nombreUsuario = "Juan"; // camelCase para variables
const CONFIGURACION_API = "https://..."; // UPPER_CASE para constantes
class ManejadorEventos {} // PascalCase para clases
interface IConfiguracionBaseDatos {} // PascalCase para interfaces, siempre utilizar I para interfaces


### Tipado y Documentación

- *Siempre tipar explícitamente* (prohibido any)
- *JSDoc obligatorio* para funciones públicas
- *Imports organizados*: externos → internos → relativos

### Ejemplo de Función

typescript
/**
 * Calcula el precio total con descuentos aplicados
 * @param precioBase - Precio inicial del producto
 * @param porcentajeDescuento - Descuento a aplicar (0-100)
 * @returns Precio final después del descuento
 */
function calcularPrecioConDescuento(
  precioBase: number,
  porcentajeDescuento: number
): number {
  return precioBase * (1 - porcentajeDescuento / 100);
}


## Python

### Nomenclatura

python
#  Correcto
nombre_usuario = "Juan"                 # snake_case para variables
CONFIGURACION_API = "https://..."       # UPPER_CASE para constantes
class ManejadorEventos:                 # PascalCase para clases
    pass

def calcular_precio_total():            # snake_case para funciones
    pass


### Documentación y Formato

- *Docstrings obligatorios* (estilo Google o NumPy)
- *Type hints* en todas las funciones
- *Límite 79 caracteres* por línea
- *Imports*: estándar → terceros → locales

### Ejemplo de Función

python
def calcular_precio_con_descuento(
    precio_base: float,
    porcentaje_descuento: float
) -> float:
    """
    Calcula el precio total con descuentos aplicados.

    Args:
        precio_base: Precio inicial del producto
        porcentaje_descuento: Descuento a aplicar (0-100)

    Returns:
        Precio final después del descuento

    Raises:
        ValueError: Si el porcentaje está fuera del rango 0-100
    """
    if not 0 <= porcentaje_descuento <= 100:
        raise ValueError("El porcentaje debe estar entre 0 y 100")

    return precio_base * (1 - porcentaje_descuento / 100)


## Go

### Nomenclatura

go
//  Correcto
var nombreUsuario string               // camelCase para privadas
var ConfiguracionAPI string           // PascalCase para exportadas
const TiempoEsperaMaximo = 30         // PascalCase para constantes exportadas

type ManejadorEventos struct {        // PascalCase para tipos exportados
    baseDatos *sql.DB                 // camelCase para campos privados
}


### Documentación y Formato

- *Comentarios obligatorios* para funciones exportadas
- *Un paquete por directorio*
- *Errores siempre verificados*
- *Interfaces pequeñas* (1-3 métodos máximo)

### Ejemplo de Función

go
// CalcularPrecioConDescuento calcula el precio total con descuentos aplicados.
// Retorna error si el porcentaje está fuera del rango 0-100.
func CalcularPrecioConDescuento(precioBase float64, porcentajeDescuento float64) (float64, error) {
    if porcentajeDescuento < 0 || porcentajeDescuento > 100 {
        return 0, fmt.Errorf("el porcentaje debe estar entre 0 y 100, recibido: %.2f", porcentajeDescuento)
    }

    return precioBase * (1 - porcentajeDescuento/100), nil
}


##  Herramientas y Configuración

### Control de Calidad Obligatorio

- *TypeScript/JavaScript*: ESLint + Prettier + TypeScript compiler
- *Python*: Pylint + Black + mypy + pytest
- *Go*: gofmt + golangci-lint + go vet + go test

### Testing Obligatorio

- *Cobertura mínima*: 80%
- *Tests unitarios* para toda lógica de negocio
- *Tests de integración* para APIs
- *Nombres de tests descriptivos* en español

### Git y Commits

bash
#  Formato de commits
feat(eventos): añadir validación de fechas
fix(api): corregir error en autenticación
docs(readme): actualizar instrucciones de instalación
test(usuarios): añadir tests para validación de email


##  Reglas Críticas para IA

### Antes de Escribir Código

1. *SIEMPRE* leer el archivo actual completo
2. *ENTENDER* el contexto y propósito
3. *VERIFICAR* que se siguen estas reglas
4. *PREGUNTAR* si algo no está claro

### Durante el Desarrollo

- *NUNCA* usar any en TypeScript
- *SIEMPRE* manejar errores en Go
- *OBLIGATORIO* documentar funciones públicas
- *PROHIBIDO* código duplicado
- *REQUERIDO* nombres en español

### Revisión Final

-  ¿Código en español?
-  ¿Sigue convenciones de nomenclatura?
-  ¿Documentación completa?
-  ¿Manejo de errores?
-  ¿Tests incluidos?
-  ¿Menos de 100 líneas por archivo?