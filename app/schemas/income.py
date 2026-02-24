"""
Schemas Pydantic para Ingresos.
"""
from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


class IncomeCreate(BaseModel):
    fecha: date
    descripcion: str = Field(..., min_length=1, max_length=255)
    monto: float = Field(..., gt=0, description="El monto debe ser mayor a 0")


class IncomeUpdate(BaseModel):
    fecha: Optional[date] = None
    descripcion: Optional[str] = Field(None, min_length=1, max_length=255)
    monto: Optional[float] = Field(None, gt=0)


class IncomeResponse(BaseModel):
    id: int
    fecha: date
    descripcion: str
    monto: float
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
