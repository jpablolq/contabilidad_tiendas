"""
Servicio de notificaciones programadas.
Revisa periódicamente los pedidos pendientes cuya fecha/hora de llegada
ya pasó y genera notificaciones.
"""
import asyncio
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.pending_order import PendingOrder

logger = logging.getLogger("contabilidad.notificaciones")


class NotificationScheduler:
    """Scheduler que revisa pedidos vencidos cada minuto."""

    def __init__(self, check_interval_seconds: int = 60):
        self.check_interval = check_interval_seconds
        self._task: asyncio.Task | None = None
        self._running = False

    async def start(self):
        """Iniciar el scheduler de notificaciones."""
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._loop())
        logger.info("Scheduler de notificaciones iniciado (intervalo: %ds)", self.check_interval)

    async def stop(self):
        """Detener el scheduler de notificaciones."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Scheduler de notificaciones detenido")

    async def _loop(self):
        """Loop principal que revisa pedidos periódicamente."""
        while self._running:
            try:
                pedidos_vencidos = self._check_pending_orders()
                if pedidos_vencidos:
                    logger.info(
                        "📦 %d pedido(s) pendiente(s) de confirmación:",
                        len(pedidos_vencidos),
                    )
                    for pedido in pedidos_vencidos:
                        logger.info(
                            "   → Proveedor: %s | Monto: $%.2f | "
                            "Llegada estimada: %s %s",
                            pedido.proveedor,
                            pedido.monto,
                            pedido.fecha_llegada_estimada,
                            pedido.hora_llegada_estimada,
                        )
            except Exception as e:
                logger.error("Error verificando pedidos: %s", e)

            await asyncio.sleep(self.check_interval)

    def _check_pending_orders(self) -> list:
        """Consultar pedidos vencidos no notificados."""
        db: Session = SessionLocal()
        try:
            ahora = datetime.now()
            fecha_hoy = ahora.date()
            hora_actual = ahora.strftime("%H:%M")

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
                .all()
            )
            return pedidos
        finally:
            db.close()


# Instancia global del scheduler
notification_scheduler = NotificationScheduler(check_interval_seconds=60)
