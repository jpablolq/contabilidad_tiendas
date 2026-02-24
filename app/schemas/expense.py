"""
Schemas Pydantic para Gastos.
"""
from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional
from app.models.expense import ExpenseCategory


class ExpenseCreate(BaseModel):
    fecha: date
    descripcion: str = Field(..., min_length=1, max_length=255)
    monto: float = Field(..., gt=0, description="El monto debe ser mayor a 0")
    categoria: ExpenseCategory = ExpenseCategory.OTROS


class ExpenseUpdate(BaseModel):
    fecha: Optional[date] = None
    descripcion: Optional[str] = Field(None, min_length=1, max_length=255)
    monto: Optional[float] = Field(None, gt=0)
    categoria: Optional[ExpenseCategory] = None


class ExpenseResponse(BaseModel):
    id: int
    fecha: date
    descripcion: str
    monto: float
    categoria: ExpenseCategory
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
