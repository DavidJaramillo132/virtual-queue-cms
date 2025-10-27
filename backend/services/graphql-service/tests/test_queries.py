import pytest
from app.schema import schema
from strawberry.test import BaseGraphQLTestClient

@pytest.fixture
def graphql_client():
    return BaseGraphQLTestClient(schema)

def test_reporte_general(graphql_client):
    """
    Test para el reporte general
    """
    query = """
        query {
            reporteGeneral {
                totalNegocios
                totalClientes
                totalCitas
                citasAtendidas
                ingresosTotales
            }
        }
    """
    
    result = graphql_client.query(query)
    assert result.errors is None
    assert "reporteGeneral" in result.data

def test_negocios_query(graphql_client):
    """
    Test para obtener negocios
    """
    query = """
        query {
            negocios(limit: 5) {
                id
                nombre
                categoria
                estado
            }
        }
    """
    
    result = graphql_client.query(query)
    assert result.errors is None
    assert "negocios" in result.data

def test_filas_activas(graphql_client):
    """
    Test para obtener filas activas
    """
    query = """
        query {
            filasActivas(limit: 10) {
                id
                state
            }
        }
    """
    
    result = graphql_client.query(query)
    assert result.errors is None
    assert "filasActivas" in result.data
