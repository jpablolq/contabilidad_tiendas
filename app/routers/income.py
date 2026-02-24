"""
Router para gestión de Ingresos.
CRUD completo + filtrado por fecha.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models.income import Income
from app.schemas.income import IncomeCreate, IncomeUpdate, IncomeResponse

router = APIRouter(prefix="/ingresos", tags=["Ingresos"])


@router.post("/", response_model=IncomeResponse, status_code=201)
def crear_ingreso(ingreso: IncomeCreate, db: Session = Depends(get_db)):
    """Registrar un nuevo ingreso."""
    db_ingreso = Income(**ingreso.model_dump())
    db.add(db_ingreso)
    db.commit()
    db.refresh(db_ingreso)
    return db_ingreso


@router.get("/", response_model=List[IncomeResponse])
def listar_ingresos(
    fecha: Optional[date] = Query(None, description="Filtrar por fecha exacta"),
    fecha_inicio: Optional[date] = Query(None, description="Fecha inicio rango"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin rango"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """Listar ingresos con filtros opcionales por fecha."""
    query = db.query(Income)

    if fecha:
        query = query.filter(Income.fecha == fecha)
    if fecha_inicio:
        query = query.filter(Income.fecha >= fecha_inicio)
    if fecha_fin:
        query = query.filter(Income.fecha <= fecha_fin)

    query = query.order_by(Income.fecha.desc(), Income.id.desc())
    return query.offset(skip).limit(limit).all()


@router.get("/{ingreso_id}", response_model=IncomeResponse)
def obtener_ingreso(ingreso_id: int, db: Session = Depends(get_db)):
    """Obtener un ingreso por su ID."""
    ingreso = db.query(Income).filter(Income.id == ingreso_id).first()
    if not ingreso:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return ingreso


@router.put("/{ingreso_id}", response_model=IncomeResponse)
def actualizar_ingreso(
    ingreso_id: int, datos: IncomeUpdate, db: Session = Depends(get_db)
):
    """Actualizar un ingreso existente."""
    ingreso = db.query(Income).filter(Income.id == ingreso_id).first()
    if not ingreso:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")

    datos_dict = datos.model_dump(exclude_unset=True)
    for key, value in datos_dict.items():
        setattr(ingreso, key, value)

    db.commit()
    db.refresh(ingreso)
    return ingreso


@router.delete("/{ingreso_id}", status_code=204)
def eliminar_ingreso(ingreso_id: int, db: Session = Depends(get_db)):
    """Eliminar un ingreso."""
    ingreso = db.query(Income).filter(Income.id == ingreso_id).first()
    if not ingreso:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    db.delete(ingreso)
    db.commit()
