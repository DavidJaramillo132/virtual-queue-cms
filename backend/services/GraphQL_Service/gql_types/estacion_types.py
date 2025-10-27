import strawberry
from gql_types.enums import EstadoEstacion

@strawberry.type
class EstacionDTO:
    id: str
    nombre: str
    estado: EstadoEstacion

@strawberry.type
class Estacion:
    id: str
    nombre: str
    ubicacion: str
    estado: EstadoEstacion
