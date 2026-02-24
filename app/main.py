"""
Software Contable - Backend API
================================
Aplicación principal FastAPI para gestión contable de negocio.

Módulos:
  - Gestión de Ingresos y Gastos diarios
  - Pedidos Pendientes a Proveedores
  - Reportes y Exportación a Excel
  - Notificaciones de pedidos vencidos
"""
import logging
import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.database import engine, Base
from app.routers import income, expenses, reports, pending_orders
from app.services.notification_scheduler import notification_scheduler

# Ruta al directorio frontend
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("contabilidad")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ciclo de vida de la aplicación: startup y shutdown."""
    # ── STARTUP ──
    logger.info("Inicializando base de datos...")
    Base.metadata.create_all(bind=engine)
    logger.info("Base de datos lista.")

    logger.info("Iniciando scheduler de notificaciones...")
    await notification_scheduler.start()

    yield

    # ── SHUTDOWN ──
    logger.info("Deteniendo scheduler de notificaciones...")
    await notification_scheduler.stop()
    logger.info("Aplicación finalizada.")


app = FastAPI(
    title="Software Contable",
    description="""
## Sistema de Contabilidad para Negocio

### Módulos disponibles:

**📊 Ingresos y Gastos**
- Registrar ingresos diarios
- Registrar gastos por categoría (proveedores, útiles, medicamentos, otros)
- Historial por día, mes y año
- Exportación a Excel

**📦 Pedidos Pendientes**
- Registrar pedidos a proveedores con fecha y hora estimada
- Notificaciones automáticas cuando llega la hora
- Registro automático en gastos al confirmar recepción

**📈 Reportes**
- Resúmenes diarios, mensuales y anuales
- Balance de ingresos vs gastos
- Desglose por categoría de gastos
    """,
    version="1.0.0",
    lifespan=lifespan,
)

# CORS para permitir conexiones desde frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(income.router)
app.include_router(expenses.router)
app.include_router(reports.router)
app.include_router(pending_orders.router)

# Servir archivos estáticos del frontend (CSS, JS)
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


@app.get("/", tags=["Root"])
def root():
    """Servir la página principal del frontend."""
    return FileResponse(str(FRONTEND_DIR / "index.html"))


@app.get("/api/info", tags=["Root"])
def api_info():
    """Endpoint de información del sistema."""
    return {
        "nombre": "Software Contable",
        "version": "1.0.0",
        "modulos": [
            "Gestión de Ingresos (/ingresos)",
            "Gestión de Gastos (/gastos)",
            "Reportes y Exportación (/reportes)",
            "Pedidos Pendientes (/pedidos)",
        ],
        "documentacion": "/docs",
    }


@app.get("/health", tags=["Root"])
def health_check():
    """Verificar que el servidor está funcionando."""
    return {"status": "ok", "mensaje": "El servidor está funcionando correctamente"}
