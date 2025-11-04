import jwt
from config import config

def decode_jwt(token: str):
    if not token:
        raise Exception("Token vacío o no enviado")

    # Quitar "Bearer "
    token = token.replace("Bearer ", "")

    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception("Token expirado")
    except jwt.InvalidTokenError:
        raise Exception("Token inválido")
