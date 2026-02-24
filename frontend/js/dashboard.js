/**
 * Módulo Dashboard - Resumen del día y del mes actual.
 */
const Dashboard = {
  async cargar() {
    const hoy = new Date().toISOString().split('T')[0];
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = ahora.getMonth() + 1;

    try {
      const [diario, mensual, pedidosVencidos, pedidosPend] = await Promise.all([
        Api.getResumenDiario(hoy),
        Api.getResumenMensual(anio, mes),
        Api.getPedidosPorVencer(),
        Api.getPedidos({ solo_pendientes: true }),
      ]);

      // Cards del día
      document.getElementById('dash-ingresos').textContent = formatMoney(diario.total_ingresos);
      document.getElementById('dash-gastos').textContent = formatMoney(diario.total_gastos);
      const balEl = document.getElementById('dash-balance');
      balEl.textContent = formatMoney(diario.balance);
      balEl.className = `text-2xl font-bold mt-1 ${diario.balance >= 0 ? 'text-green-600' : 'text-red-600'}`;

      // Categorías del día
      this.renderCategorias(diario.gastos_por_categoria, diario.total_gastos);

      // Cards del mes
      document.getElementById('dash-mes-ingresos').textContent = formatMoney(mensual.total_ingresos);
      document.getElementById('dash-mes-gastos').textContent = formatMoney(mensual.total_gastos);
      const balMes = document.getElementById('dash-mes-balance');
      balMes.textContent = formatMoney(mensual.balance);
      balMes.className = `text-xl font-bold ${mensual.balance >= 0 ? 'text-green-600' : 'text-red-600'}`;

      // Pedidos pendientes
      this.renderPedidosPendientes(pedidosPend);

      // Notificaciones badge
      if (pedidosVencidos.total_notificaciones > 0) {
        document.getElementById('badge-notif').textContent = pedidosVencidos.total_notificaciones;
        document.getElementById('badge-notif').classList.remove('hidden');
        document.getElementById('badge-pedidos').textContent = pedidosVencidos.total_notificaciones;
        document.getElementById('badge-pedidos').classList.remove('hidden');
      } else {
        document.getElementById('badge-notif').classList.add('hidden');
        document.getElementById('badge-pedidos').classList.add('hidden');
      }
    } catch (err) {
      console.error('Error cargando dashboard:', err);
    }
  },

  renderCategorias(categorias, totalGastos) {
    const container = document.getElementById('dash-categorias');
    if (!categorias || categorias.length === 0) {
      container.innerHTML = '<p class="text-gray-400 text-sm">Sin gastos registrados hoy</p>';
      return;
    }

    const colors = {
      pedidos_proveedores: 'bg-blue-500',
      utiles: 'bg-purple-500',
      medicamentos: 'bg-pink-500',
      consumo: 'bg-orange-500',
      otros: 'bg-gray-500',
    };

    container.innerHTML = categorias.map(cat => {
      const pct = totalGastos > 0 ? (cat.total / totalGastos * 100).toFixed(0) : 0;
      const color = colors[cat.categoria] || 'bg-gray-400';
      return `
        <div>
          <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-600">${getCategoryLabel(cat.categoria)}</span>
            <span class="font-medium">${formatMoney(cat.total)} <span class="text-gray-400">(${pct}%)</span></span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div class="${color} category-bar" style="width: ${pct}%"></div>
          </div>
        </div>`;
    }).join('');
  },

  renderPedidosPendientes(pedidos) {
    const container = document.getElementById('dash-pedidos-pendientes');
    if (!pedidos || pedidos.length === 0) {
      container.innerHTML = '<p class="text-gray-400 text-sm">No hay pedidos pendientes</p>';
      return;
    }

    container.innerHTML = pedidos.slice(0, 5).map(p => `
      <div class="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
        <div>
          <p class="text-sm font-medium text-gray-700">${escapeHtml(p.proveedor)}</p>
          <p class="text-xs text-gray-500">${p.fecha_llegada_estimada} a las ${p.hora_llegada_estimada}</p>
        </div>
        <span class="font-semibold text-yellow-700">${formatMoney(p.monto)}</span>
      </div>
    `).join('');

    if (pedidos.length > 5) {
      container.innerHTML += `<p class="text-xs text-gray-400 text-center mt-2">y ${pedidos.length - 5} más...</p>`;
    }
  },
};
