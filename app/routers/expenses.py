"""
Router para gestión de Gastos.
CRUD completo + filtrado por fecha y categoría.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models.expense import Expense, ExpenseCategory
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse

router = APIRouter(prefix="/gastos", tags=["Gastos"])


@router.post("/", response_model=ExpenseResponse, status_code=201)
def crear_gasto(gasto: ExpenseCreate, db: Session = Depends(get_db)):
    """Registrar un nuevo gasto."""
    db_gasto = Expense(**gasto.model_dump())
    db.add(db_gasto)
    db.commit()
    db.refresh(db_gasto)
    return db_gasto


@router.get("/", response_model=List[ExpenseResponse])
def listar_gastos(
    fecha: Optional[date] = Query(None, description="Filtrar por fecha exacta"),
    fecha_inicio: Optional[date] = Query(None, description="Fecha inicio rango"),
    fecha_fin: Optional[date] = Query(None, description="Fecha fin rango"),
    categoria: Optional[ExpenseCategory] = Query(
        None, description="Filtrar por categoría"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """Listar gastos con filtros opcionales por fecha y categoría."""
    query = db.query(Expense)

    if fecha:
        query = query.filter(Expense.fecha == fecha)
    if fecha_inicio:
        query = query.filter(Expense.fecha >= fecha_inicio)
    if fecha_fin:
        query = query.filter(Expense.fecha <= fecha_fin)
    if categoria:
        query = query.filter(Expense.categoria == categoria)

    query = query.order_by(Expense.fecha.desc(), Expense.id.desc())
    return query.offset(skip).limit(limit).all()


@router.get("/categorias", response_model=List[str])
def listar_categorias():
    """Listar todas las categorías de gastos disponibles."""
    return [c.value for c in ExpenseCategory]


@router.get("/{gasto_id}", response_model=ExpenseResponse)
def obtener_gasto(gasto_id: int, db: Session = Depends(get_db)):
    """Obtener un gasto por su ID."""
    gasto = db.query(Expense).filter(Expense.id == gasto_id).first()
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return gasto


@router.put("/{gasto_id}", response_model=ExpenseResponse)
def actualizar_gasto(
    gasto_id: int, datos: ExpenseUpdate, db: Session = Depends(get_db)
):
    """Actualizar un gasto existente."""
    gasto = db.query(Expense).filter(Expense.id == gasto_id).first()
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    datos_dict = datos.model_dump(exclude_unset=True)
    for key, value in datos_dict.items():
        setattr(gasto, key, value)

    db.commit()
    db.refresh(gasto)
    return gasto


@router.delete("/{gasto_id}", status_code=204)
def eliminar_gasto(gasto_id: int, db: Session = Depends(get_db)):
    """Eliminar un gasto."""
    gasto = db.query(Expense).filter(Expense.id == gasto_id).first()
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    db.delete(gasto)
    db.commit()
