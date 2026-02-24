"""
Modelo de Pedidos Pendientes a Proveedores.
"""
from sqlalchemy import Column, Integer, Float, String, Date, DateTime, Boolean, Text
from sqlalchemy.sql import func
from app.database import Base


class PendingOrder(Base):
    __tablename__ = "pedidos_pendientes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    proveedor = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=True)
    monto = Column(Float, nullable=False)
    fecha_pedido = Column(Date, nullable=False)
    fecha_llegada_estimada = Column(Date, nullable=False)
    hora_llegada_estimada = Column(String(5), nullable=False)  # Formato HH:MM
    recibido = Column(Boolean, default=False)
    notificado = Column(Boolean, default=False)
    registrado_en_gastos = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
