"""
Modelo de Gastos.
Categorías:
  - pedidos_proveedores: Pedidos a proveedores
  - utiles: Compra de útiles
  - medicamentos: Compra de medicamentos  - consumo: Gastos de consumo  - otros: Otros gastos
"""
from sqlalchemy import Column, Integer, Float, String, Date, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
import enum
from app.database import Base


class ExpenseCategory(str, enum.Enum):
    PEDIDOS_PROVEEDORES = "pedidos_proveedores"
    UTILES = "utiles"
    MEDICAMENTOS = "medicamentos"
    CONSUMO = "consumo"
    OTROS = "otros"


class Expense(Base):
    __tablename__ = "gastos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fecha = Column(Date, nullable=False, index=True)
    descripcion = Column(String(255), nullable=False)
    monto = Column(Float, nullable=False)
    categoria = Column(
        SQLEnum(ExpenseCategory),
        nullable=False,
        default=ExpenseCategory.OTROS,
    )
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
