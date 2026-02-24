"""
Modelo de Ingresos.
"""
from sqlalchemy import Column, Integer, Float, String, Date, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Income(Base):
    __tablename__ = "ingresos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fecha = Column(Date, nullable=False, index=True)
    descripcion = Column(String(255), nullable=False)
    monto = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
