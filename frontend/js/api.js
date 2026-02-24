/**
 * API Client - Comunicación con el backend FastAPI.
 */
const API_BASE = '';

const Api = {
  async request(method, url, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${url}`, opts);

    if (res.status === 204) return null;

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Error desconocido' }));
      throw new Error(err.detail || `Error ${res.status}`);
    }

    // Excel download
    if (res.headers.get('content-type')?.includes('spreadsheet')) {
      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') || '';
      const match = disposition.match(/filename=(.+)/);
      const filename = match ? match[1] : 'reporte.xlsx';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      return null;
    }

    return res.json();
  },

  // ─── INGRESOS ─────────────────────────────
  getIngresos(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('GET', `/ingresos/?${qs}`);
  },
  createIngreso(data) { return this.request('POST', '/ingresos/', data); },
  updateIngreso(id, data) { return this.request('PUT', `/ingresos/${id}`, data); },
  deleteIngreso(id) { return this.request('DELETE', `/ingresos/${id}`); },

  // ─── GASTOS ───────────────────────────────
  getGastos(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('GET', `/gastos/?${qs}`);
  },
  createGasto(data) { return this.request('POST', '/gastos/', data); },
  updateGasto(id, data) { return this.request('PUT', `/gastos/${id}`, data); },
  deleteGasto(id) { return this.request('DELETE', `/gastos/${id}`); },

  // ─── PEDIDOS ──────────────────────────────
  getPedidos(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('GET', `/pedidos/?${qs}`);
  },
  createPedido(data) { return this.request('POST', '/pedidos/', data); },
  updatePedido(id, data) { return this.request('PUT', `/pedidos/${id}`, data); },
  deletePedido(id) { return this.request('DELETE', `/pedidos/${id}`); },
  confirmarPedido(id, recibido) {
    return this.request('POST', `/pedidos/${id}/confirmar`, { recibido });
  },
  getPedidosPorVencer() { return this.request('GET', '/pedidos/por-vencer'); },

  // ─── REPORTES ─────────────────────────────
  getResumenDiario(fecha) {
    return this.request('GET', `/reportes/diario?fecha=${fecha}`);
  },
  getResumenMensual(anio, mes) {
    return this.request('GET', `/reportes/mensual?anio=${anio}&mes=${mes}`);
  },
  getResumenAnual(anio, incluirMeses = false) {
    return this.request('GET', `/reportes/anual?anio=${anio}&incluir_meses=${incluirMeses}`);
  },
  getHistorial() { return this.request('GET', '/reportes/historial/fechas-disponibles'); },
  exportarExcel(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('GET', `/reportes/exportar/excel?${qs}`);
  },
};
