import os
from dotenv import load_dotenv
import psycopg
from psycopg.rows import dict_row
from typing import Optional

load_dotenv()

class DatabaseConnection:
    """
    Clase para manejar la conexión a la base de datos Supabase
    """
    _instance: Optional['DatabaseConnection'] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        self.host = os.getenv("DB_HOST")
        self.port = os.getenv("DB_PORT", "5432")
        self.user = os.getenv("DB_USER")
        self.password = os.getenv("DB_PASS")
        self.database = os.getenv("DB_NAME")
        self.environment = os.getenv("ENVIRONMENT", "development")
    
    def get_connection_string(self) -> str:
        """
        Genera la cadena de conexión para Supabase
        """
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"
    
    def get_connection(self):
        """
        Crea y retorna una conexión a la base de datos
        """
        try:
            conn = psycopg.connect(
                self.get_connection_string(),
                row_factory=dict_row
            )
            print(f"[v0] Conexión exitosa a {self.environment} - {self.host}")
            return conn
        except Exception as e:
            print(f"[v0] Error al conectar a la base de datos: {e}")
            raise

# Instancia global
db = DatabaseConnection()

def get_db_connection():
    """
    Función helper para obtener una conexión
    """
    return db.get_connection()

def test_connection():
    """
    Prueba la conexión a la base de datos
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"[v0] PostgreSQL version: {version}")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"[v0] Error en test de conexión: {e}")
        return False
