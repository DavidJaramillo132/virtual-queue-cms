#!/usr/bin/env python3
"""
Script para generar firma HMAC para webhooks de partners
"""
import hmac
import hashlib
import time
import json

# Configuración
HMAC_SECRET = "mi_secreto_super_seguro_cambiar_en_produccion"
PARTNER_ID = "7351757e-7f56-4133-af42-b8e8522b6316"  # UUID format

# Payload de ejemplo (animal adoptado)
payload = {
    "event_type": "animal.adopted",
    "data": {
        "usuario_email": "usuario@ejemplo.com",
        "animal_id": "12345",
        "animal_tipo": "perro",
        "animal_nombre": "Max",
        "fecha_adopcion": "2026-01-18T15:30:00Z"
    }
}

# Generar timestamp actual
timestamp = int(time.time())

# Convertir payload a JSON string y luego a bytes
payload_json = json.dumps(payload, separators=(',', ':'))  # Sin espacios
payload_bytes = payload_json.encode('utf-8')

# Crear mensaje: "timestamp.payload"
mensaje = f"{timestamp}.".encode() + payload_bytes

# Generar firma HMAC-SHA256
firma = hmac.new(
    HMAC_SECRET.encode(),
    mensaje,
    hashlib.sha256
).hexdigest()

# Mostrar resultados
print("=" * 70)
print("🔐 FIRMA HMAC GENERADA PARA WEBHOOK")
print("=" * 70)
print()
print("📋 Headers a enviar:")
print(f"   X-Webhook-Signature: {firma}")
print(f"   X-Webhook-Timestamp: {timestamp}")
print(f"   X-Partner-ID: {PARTNER_ID} (opcional)")
print()
print("🌐 URL del endpoint:")
print(f"   POST http://localhost:8002/webhooks/partners/{PARTNER_ID}")
print()
print("📦 Body (JSON):")
print(json.dumps(payload, indent=2))
print()
print("=" * 70)
print("📋 EJEMPLO CURL:")
print("=" * 70)
print()
curl_command = f'''curl -X POST http://localhost:8002/webhooks/partners/{PARTNER_ID} \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Signature: {firma}" \\
  -H "X-Webhook-Timestamp: {timestamp}" \\
  -H "X-Partner-ID: {PARTNER_ID}" \\
  -d '{payload_json}'
'''
print(curl_command)
print()
print("=" * 70)
print("📋 PARA USAR EN N8N:")
print("=" * 70)
print()
print("HTTP Request Node:")
print(f"  URL: http://payments-service:8002/webhooks/partners/{PARTNER_ID}")
print("  Method: POST")
print()
print("Headers:")
print(f"  X-Webhook-Signature: {firma}")
print(f"  X-Webhook-Timestamp: {timestamp}")
print(f"  X-Partner-ID: {PARTNER_ID}")
print()
print("Body (JSON):")
print(payload_json)
print()
print("⚠️  NOTA: La firma es válida por 5 minutos (300 segundos)")
print("    Si la petición falla, ejecuta este script de nuevo para generar")
print("    una firma actualizada.")
print()
