"""
Schemas Pydantic para Reportes y Resúmenes.
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import date


class ExpenseByCategoryDetail(BaseModel):
    categoria: str
    total: float
    cantidad: int


class DailySummary(BaseModel):
    fecha: date
    total_ingresos: float
    total_gastos: float
    balance: float
    cantidad_ingresos: int
    cantidad_gastos: int
    gastos_por_categoria: List[ExpenseByCategoryDetail]


class MonthlySummary(BaseModel):
    anio: int
    mes: int
    total_ingresos: float
    total_gastos: float
    balance: float
    cantidad_ingresos: int
    cantidad_gastos: int
    gastos_por_categoria: List[ExpenseByCategoryDetail]
    dias_con_registros: int


class YearlySummary(BaseModel):
    anio: int
    total_ingresos: float
    total_gastos: float
    balance: float
    cantidad_ingresos: int
    cantidad_gastos: int
    gastos_por_categoria: List[ExpenseByCategoryDetail]
    resumen_mensual: Optional[List[MonthlySummary]] = None
