# Practica 6 GraphQL - Python Version

API GraphQL construida con FastAPI y Strawberry GraphQL para gestionar citas, servicios y negocios.

## Requisitos

- Python 3.9 o superior
- Un servicio REST API corriendo en `http://localhost:3000` (configurable)

## Instalación

1. **Instalar las dependencias:**

\`\`\`bash
pip install -r requirements.txt
\`\`\`

O un entorno virtual:

\`\`\`bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
\`\`\`

## Configuración

Puedes configurar las siguientes variables de entorno (opcional):

\`\`\`bash
# URL del servicio REST
export REST_API_BASE_URL=http://localhost:3000

# Puerto del servidor GraphQL
export PORT=3001

# Host del servidor
export HOST=0.0.0.0
\`\`\`

O crear un archivo `.env` en la raíz del proyecto:

\`\`\`
REST_API_BASE_URL=http://localhost:3000
PORT=3001
HOST=0.0.0.0
\`\`\`

## Ejecución

Para iniciar el servidor:

\`\`\`bash
python main.py
\`\`\`

El servidor estará disponible en:
- **API GraphQL:** http://localhost:3001/graphql
- **GraphQL Playground:** http://localhost:3001/graphql (abrir en el navegador)
- **Documentación API:** http://localhost:3001/docs

## Verificar que funciona correctamente

1. **Verifica que el servidor esté corriendo:**
   - Abre http://localhost:3001 en tu navegador
   - Deberías ver un mensaje JSON indicando que la API está corriendo

2. **Prueba el GraphQL Playground:**
   - Abre http://localhost:3001/graphql en tu navegador
   - Deberías ver la interfaz de GraphQL Playground

3. **Ejecuta una query de prueba:**
   En el GraphQL Playground, ejecuta:

```graphql
query {
  usuarios {
    id
    nombreCompleto
    email
    rol
  }
}
