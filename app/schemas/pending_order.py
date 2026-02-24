"""
Schemas Pydantic para Pedidos Pendientes.
"""
from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime
from typing import Optional
import re


class PendingOrderCreate(BaseModel):
    proveedor: str = Field(..., min_length=1, max_length=255)
    descripcion: Optional[str] = None
    monto: float = Field(..., gt=0, description="El monto debe ser mayor a 0")
    fecha_pedido: date
    fecha_llegada_estimada: date
    hora_llegada_estimada: str = Field(
        ..., description="Hora estimada de llegada en formato HH:MM"
    )

    @field_validator("hora_llegada_estimada")
    @classmethod
    def validar_formato_hora(cls, v: str) -> str:
        if not re.match(r"^\d{2}:\d{2}$", v):
            raise ValueError("El formato de hora debe ser HH:MM (ej: 14:30)")
        hh, mm = v.split(":")
        if not (0 <= int(hh) <= 23 and 0 <= int(mm) <= 59):
            raise ValueError("Hora inválida. Horas: 00-23, Minutos: 00-59")
        return v


class PendingOrderUpdate(BaseModel):
    proveedor: Optional[str] = Field(None, min_length=1, max_length=255)
    descripcion: Optional[str] = None
    monto: Optional[float] = Field(None, gt=0)
    fecha_llegada_estimada: Optional[date] = None
    hora_llegada_estimada: Optional[str] = None

    @field_validator("hora_llegada_estimada")
    @classmethod
    def validar_formato_hora(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not re.match(r"^\d{2}:\d{2}$", v):
            raise ValueError("El formato de hora debe ser HH:MM (ej: 14:30)")
        hh, mm = v.split(":")
        if not (0 <= int(hh) <= 23 and 0 <= int(mm) <= 59):
            raise ValueError("Hora inválida. Horas: 00-23, Minutos: 00-59")
        return v


class PendingOrderConfirm(BaseModel):
    recibido: bool = Field(
        ..., description="True si se recibió el pedido, False si no"
    )


class PendingOrderResponse(BaseModel):
    id: int
    proveedor: str
    descripcion: Optional[str] = None
    monto: float
    fecha_pedido: date
    fecha_llegada_estimada: date
    hora_llegada_estimada: str
    recibido: bool
    notificado: bool
    registrado_en_gastos: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
