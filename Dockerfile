# ── Etapa 1: Builder ──
FROM python:3.12-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Etapa 2: Runtime ──
FROM python:3.12-slim

WORKDIR /app

# Copiar dependencias instaladas desde builder
COPY --from=builder /install /usr/local

# Copiar código fuente
COPY app/ ./app/
COPY frontend/ ./frontend/

# Crear directorio para la base de datos
RUN mkdir -p /app/data

# Puerto de la aplicación
EXPOSE 8000

# Ejecutar la aplicación
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
