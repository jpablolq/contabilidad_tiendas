/**
 * Módulo Reportes - Reportes diarios/mensuales/anuales + exportación Excel.
 */
const Reportes = {
  ultimoReporte: null,

  async init() {
    const hoy = new Date();
    document.getElementById('rep-fecha').value = hoy.toISOString().split('T')[0];
    document.getElementById('rep-mes').value = hoy.getMonth() + 1;
    document.getElementById('rep-anio').value = hoy.getFullYear();
    this.cambiarTipo();
    this.cargarHistorial();
  },

  cambiarTipo() {
    const tipo = document.getElementById('rep-tipo').value;
    document.getElementById('rep-fecha-container').classList.toggle('hidden', tipo !== 'diario');
    document.getElementById('rep-mes-container').classList.toggle('hidden', tipo === 'diario');
    document.getElementById('rep-anio-container').classList.toggle('hidden', tipo === 'diario');
  },

  async generar() {
    const tipo = document.getElementById('rep-tipo').value;

    try {
      let data;
      switch (tipo) {
        case 'diario':
          const fecha = document.getElementById('rep-fecha').value;
          if (!fecha) { showToast('Selecciona una fecha', 'warning'); return; }
          data = await Api.getResumenDiario(fecha);
          break;
        case 'mensual':
          const anioM = document.getElementById('rep-anio').value;
          const mes = document.getElementById('rep-mes').value;
          if (!anioM || !mes) { showToast('Selecciona año y mes', 'warning'); return; }
          data = await Api.getResumenMensual(parseInt(anioM), parseInt(mes));
          break;
        case 'anual':
          const anioA = document.getElementById('rep-anio').value;
          if (!anioA) { showToast('Selecciona un año', 'warning'); return; }
          data = await Api.getResumenAnual(parseInt(anioA), true);
          break;
      }

      this.ultimoReporte = { tipo, data };
      this.renderReporte(data);
      document.getElementById('reporte-resultado').classList.remove('hidden');
    } catch (err) {
      showToast('Error generando reporte: ' + err.message, 'error');
    }
  },

  renderReporte(data) {
    document.getElementById('rep-total-ingresos').textContent = formatMoney(data.total_ingresos);
    document.getElementById('rep-total-gastos').textContent = formatMoney(data.total_gastos);

    const balEl = document.getElementById('rep-balance');
    balEl.textContent = formatMoney(data.balance);
    balEl.className = `text-2xl font-bold mt-1 ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`;

    document.getElementById('rep-cant-ingresos').textContent = `${data.cantidad_ingresos} registro(s)`;
    document.getElementById('rep-cant-gastos').textContent = `${data.cantidad_gastos} registro(s)`;

    // Categorías
    const container = document.getElementById('rep-categorias');
    if (!data.gastos_por_categoria || data.gastos_por_categoria.length === 0) {
      container.innerHTML = '<p class="text-gray-400 text-sm">Sin gastos en este período</p>';
      return;
    }

    const totalGastos = data.total_gastos;
    const colors = {
      pedidos_proveedores: 'bg-blue-500',
      utiles: 'bg-purple-500',
      medicamentos: 'bg-pink-500',
      consumo: 'bg-orange-500',
      otros: 'bg-gray-500',
    };

    container.innerHTML = data.gastos_por_categoria.map(cat => {
      const pct = totalGastos > 0 ? (cat.total / totalGastos * 100).toFixed(1) : 0;
      const color = colors[cat.categoria] || 'bg-gray-400';
      return `
        <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <div class="flex-1">
            <div class="flex justify-between text-sm mb-1.5">
              <span class="font-medium text-gray-700">${getCategoryLabel(cat.categoria)}</span>
              <span class="text-gray-600">${formatMoney(cat.total)} <span class="text-gray-400">(${pct}%)</span></span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div class="${color} category-bar rounded-full" style="width: ${pct}%"></div>
            </div>
          </div>
          <span class="text-xs text-gray-400 w-16 text-right">${cat.cantidad} reg.</span>
        </div>`;
    }).join('');
  },

  async exportarExcel() {
    const tipo = document.getElementById('rep-tipo').value;
    const params = {};

    switch (tipo) {
      case 'diario':
        const fecha = document.getElementById('rep-fecha').value;
        params.fecha_inicio = fecha;
        params.fecha_fin = fecha;
        break;
      case 'mensual':
        params.anio = document.getElementById('rep-anio').value;
        params.mes = document.getElementById('rep-mes').value;
        break;
      case 'anual':
        params.anio = document.getElementById('rep-anio').value;
        break;
    }

    try {
      await Api.exportarExcel(params);
      showToast('Archivo Excel descargado correctamente', 'success');
    } catch (err) {
      showToast('Error exportando: ' + err.message, 'error');
    }
  },

  async cargarHistorial() {
    try {
      const data = await Api.getHistorial();
      const container = document.getElementById('historial-fechas');

      if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-sm">No hay registros disponibles aún</p>';
        return;
      }

      const meses = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

      container.innerHTML = data.map(anio => `
        <div class="border rounded-lg p-3">
          <div class="flex items-center gap-2 mb-2">
            <i class="fas fa-calendar text-primary-500"></i>
            <span class="font-semibold text-gray-700">${anio.anio}</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${anio.meses.map(m => `
              <button onclick="Reportes.verMes(${anio.anio}, ${m})" 
                      class="px-2.5 py-1 bg-primary-50 text-primary-700 text-xs rounded-md hover:bg-primary-100 transition-colors">
                ${meses[m]}
              </button>
            `).join('')}
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Error cargando historial:', err);
    }
  },

  verMes(anio, mes) {
    document.getElementById('rep-tipo').value = 'mensual';
    document.getElementById('rep-anio').value = anio;
    document.getElementById('rep-mes').value = mes;
    this.cambiarTipo();
    this.generar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
};
