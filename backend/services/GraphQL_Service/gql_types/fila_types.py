import strawberry
from gql_types.enums import EstadoFila

@strawberry.type
class Fila:
    id: str
    nombre: str
    estado: EstadoFila
