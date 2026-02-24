"""
Router para Pedidos Pendientes a Proveedores.
CRUD + Confirmación de recepción + Registro automático en gastos.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime

from app.database import get_db
from app.models.pending_order import PendingOrder
from app.models.expense import Expense, ExpenseCategory
from app.schemas.pending_order import (
    PendingOrderCreate,
    PendingOrderUpdate,
    PendingOrderResponse,
    PendingOrderConfirm,
)

router = APIRouter(prefix="/pedidos", tags=["Pedidos Pendientes"])


@router.post("/", response_model=PendingOrderResponse, status_code=201)
def crear_pedido(pedido: PendingOrderCreate, db: Session = Depends(get_db)):
    """Registrar un nuevo pedido pendiente a un proveedor."""
    db_pedido = PendingOrder(**pedido.model_dump())
    db.add(db_pedido)
    db.commit()
    db.refresh(db_pedido)
    return db_pedido


@router.get("/", response_model=List[PendingOrderResponse])
def listar_pedidos(
    solo_pendientes: bool = Query(False, description="Mostrar solo pedidos no recibidos"),
    proveedor: Optional[str] = Query(None, description="Filtrar por nombre de proveedor"),
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """Listar pedidos pendientes con filtros opcionales."""
    query = db.query(PendingOrder)

    if solo_pendientes:
        query = query.filter(PendingOrder.recibido == False)
    if proveedor:
        query = query.filter(PendingOrder.proveedor.ilike(f"%{proveedor}%"))
    if fecha_inicio:
        query = query.filter(PendingOrder.fecha_llegada_estimada >= fecha_inicio)
    if fecha_fin:
        query = query.filter(PendingOrder.fecha_llegada_estimada <= fecha_fin)

    query = query.order_by(
        PendingOrder.fecha_llegada_estimada.asc(),
        PendingOrder.hora_llegada_estimada.asc(),
    )
    return query.offset(skip).limit(limit).all()


@router.get("/por-vencer")
def pedidos_por_vencer(db: Session = Depends(get_db)):
    """
    Obtener pedidos cuya fecha y hora de llegada estimada ya pasó
    y que aún no han sido confirmados (notificaciones pendientes).
    """
    ahora = datetime.now()
    fecha_hoy = ahora.date()
    hora_actual = ahora.strftime("%H:%M")

    # Pedidos cuya fecha ya pasó O es hoy y la hora ya pasó
    pedidos = (
        db.query(PendingOrder)
        .filter(
            PendingOrder.recibido == False,
            PendingOrder.notificado == False,
        )
        .filter(
            (PendingOrder.fecha_llegada_estimada < fecha_hoy)
            | (
                (PendingOrder.fecha_llegada_estimada == fecha_hoy)
                & (PendingOrder.hora_llegada_estimada <= hora_actual)
            )
        )
        .order_by(PendingOrder.fecha_llegada_estimada.asc())
        .all()
    )

    notificaciones = []
    for pedido in pedidos:
        notificaciones.append({
            "pedido_id": pedido.id,
            "mensaje": f"¿Recibiste el pedido del proveedor {pedido.proveedor}?",
            "proveedor": pedido.proveedor,
            "descripcion": pedido.descripcion,
            "monto": pedido.monto,
            "fecha_llegada_estimada": str(pedido.fecha_llegada_estimada),
            "hora_llegada_estimada": pedido.hora_llegada_estimada,
        })

    return {
        "total_notificaciones": len(notificaciones),
        "notificaciones": notificaciones,
    }


@router.get("/{pedido_id}", response_model=PendingOrderResponse)
def obtener_pedido(pedido_id: int, db: Session = Depends(get_db)):
    """Obtener un pedido por su ID."""
    pedido = db.query(PendingOrder).filter(PendingOrder.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return pedido


@router.put("/{pedido_id}", response_model=PendingOrderResponse)
def actualizar_pedido(
    pedido_id: int, datos: PendingOrderUpdate, db: Session = Depends(get_db)
):
    """Actualizar un pedido pendiente."""
    pedido = db.query(PendingOrder).filter(PendingOrder.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    datos_dict = datos.model_dump(exclude_unset=True)
    for key, value in datos_dict.items():
        setattr(pedido, key, value)

    db.commit()
    db.refresh(pedido)
    return pedido


@router.post("/{pedido_id}/confirmar", response_model=PendingOrderResponse)
def confirmar_pedido(
    pedido_id: int, confirmacion: PendingOrderConfirm, db: Session = Depends(get_db)
):
    """
    Confirmar si un pedido fue recibido o no.
    - Si recibido=True: marca como recibido y registra automáticamente el monto en gastos.
    - Si recibido=False: marca como notificado pero NO registra en gastos.
    """
    pedido = db.query(PendingOrder).filter(PendingOrder.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    if pedido.registrado_en_gastos:
        raise HTTPException(
            status_code=400,
            detail="Este pedido ya fue confirmado y registrado en gastos anteriormente",
        )

    pedido.notificado = True

    if confirmacion.recibido:
        # Marcar como recibido
        pedido.recibido = True
        pedido.registrado_en_gastos = True

        # Registrar automáticamente como gasto
        nuevo_gasto = Expense(
            fecha=date.today(),
            descripcion=f"Pedido proveedor: {pedido.proveedor}"
            + (f" - {pedido.descripcion}" if pedido.descripcion else ""),
            monto=pedido.monto,
            categoria=ExpenseCategory.PEDIDOS_PROVEEDORES,
        )
        db.add(nuevo_gasto)
    else:
        # No recibido, solo se guarda en registros
        pedido.recibido = False

    db.commit()
    db.refresh(pedido)
    return pedido


@router.delete("/{pedido_id}", status_code=204)
def eliminar_pedido(pedido_id: int, db: Session = Depends(get_db)):
    """Eliminar un pedido pendiente."""
    pedido = db.query(PendingOrder).filter(PendingOrder.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    db.delete(pedido)
    db.commit()
