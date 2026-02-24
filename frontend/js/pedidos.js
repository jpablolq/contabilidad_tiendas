/**
 * Módulo Pedidos Pendientes - CRUD + Confirmación + Notificaciones.
 */
const Pedidos = {
  datos: [],
  editandoId: null,
  notificacionesPendientes: [],

  async cargar() {
    try {
      const soloPendientes = document.getElementById('filtro-solo-pendientes').checked;
      this.datos = await Api.getPedidos({ solo_pendientes: soloPendientes });
      this.renderTabla();
      this.verificarNotificaciones();
    } catch (err) {
      showToast('Error cargando pedidos: ' + err.message, 'error');
    }
  },

  renderTabla() {
    const tbody = document.getElementById('tabla-pedidos');
    if (this.datos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-400"><i class="fas fa-inbox text-3xl mb-2 block"></i>No hay pedidos</td></tr>';
      return;
    }

    tbody.innerHTML = this.datos.map(p => {
      let statusBadge;
      if (p.recibido) {
        statusBadge = '<span class="badge status-recibido"><i class="fas fa-check mr-1"></i>Recibido</span>';
      } else if (p.notificado) {
        statusBadge = '<span class="badge status-no-recibido"><i class="fas fa-xmark mr-1"></i>No recibido</span>';
      } else {
        statusBadge = '<span class="badge status-pendiente"><i class="fas fa-clock mr-1"></i>Pendiente</span>';
      }

      const acciones = !p.recibido && !p.notificado ? `
        <button onclick="Pedidos.abrirModal(${p.id})" class="text-primary-600 hover:text-primary-800 mr-1" title="Editar">
          <i class="fas fa-pen-to-square"></i>
        </button>
        <button onclick="Pedidos.mostrarConfirmacion(${p.id})" class="text-green-600 hover:text-green-800 mr-1" title="Confirmar">
          <i class="fas fa-circle-check"></i>
        </button>
        <button onclick="Pedidos.eliminar(${p.id})" class="text-red-500 hover:text-red-700" title="Eliminar">
          <i class="fas fa-trash-can"></i>
        </button>
      ` : `
        <button onclick="Pedidos.eliminar(${p.id})" class="text-red-500 hover:text-red-700" title="Eliminar">
          <i class="fas fa-trash-can"></i>
        </button>
      `;

      return `
        <tr class="animate-fade-in">
          <td class="px-4 py-3 font-medium text-gray-800">${escapeHtml(p.proveedor)}</td>
          <td class="px-4 py-3 text-gray-600 text-xs">${p.descripcion ? escapeHtml(p.descripcion) : '<span class="text-gray-300">—</span>'}</td>
          <td class="px-4 py-3 text-right font-semibold text-yellow-700">${formatMoney(p.monto)}</td>
          <td class="px-4 py-3 text-center text-gray-600">${formatDate(p.fecha_llegada_estimada)}</td>
          <td class="px-4 py-3 text-center text-gray-600">${p.hora_llegada_estimada}</td>
          <td class="px-4 py-3 text-center">${statusBadge}</td>
          <td class="px-4 py-3 text-center">${acciones}</td>
        </tr>`;
    }).join('');
  },

  abrirModal(id = null) {
    this.editandoId = id;
    const ped = id ? this.datos.find(p => p.id === id) : null;

    document.getElementById('modal-title').textContent = id ? 'Editar Pedido' : 'Nuevo Pedido';
    document.getElementById('modal-body').innerHTML = `
      <div class="space-y-4">
        <div>
          <label class="input-label">Proveedor</label>
          <input type="text" id="form-ped-prov" class="input-field" placeholder="Nombre del proveedor"
                 value="${ped ? escapeHtml(ped.proveedor) : ''}" required />
        </div>
        <div>
          <label class="input-label">Descripción (opcional)</label>
          <textarea id="form-ped-desc" class="input-field" rows="2" placeholder="Detalle del pedido">${ped?.descripcion ? escapeHtml(ped.descripcion) : ''}</textarea>
        </div>
        <div>
          <label class="input-label">Monto ($)</label>
          <input type="number" id="form-ped-monto" class="input-field" placeholder="0.00" step="0.01" min="0.01"
                 value="${ped ? ped.monto : ''}" required />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="input-label">Fecha del Pedido</label>
            <input type="date" id="form-ped-fecha" class="input-field" 
                   value="${ped ? ped.fecha_pedido : new Date().toISOString().split('T')[0]}" required />
          </div>
          <div>
            <label class="input-label">Fecha Llegada</label>
            <input type="date" id="form-ped-llegada" class="input-field" 
                   value="${ped ? ped.fecha_llegada_estimada : ''}" required />
          </div>
        </div>
        <div>
          <label class="input-label">Hora Estimada de Llegada</label>
          <input type="time" id="form-ped-hora" class="input-field" 
                 value="${ped ? ped.hora_llegada_estimada : ''}" required />
        </div>
      </div>`;

    document.getElementById('modal-footer').innerHTML = `
      <button onclick="cerrarModal()" class="btn-secondary">Cancelar</button>
      <button onclick="Pedidos.guardar()" class="btn-primary"><i class="fas fa-floppy-disk mr-2"></i>Guardar</button>`;

    abrirModal();
  },

  async guardar() {
    const horaInput = document.getElementById('form-ped-hora').value;
    const data = {
      proveedor: document.getElementById('form-ped-prov').value.trim(),
      descripcion: document.getElementById('form-ped-desc').value.trim() || null,
      monto: parseFloat(document.getElementById('form-ped-monto').value),
      fecha_pedido: document.getElementById('form-ped-fecha').value,
      fecha_llegada_estimada: document.getElementById('form-ped-llegada').value,
      hora_llegada_estimada: horaInput.length === 5 ? horaInput : horaInput.substring(0, 5),
    };

    if (!data.proveedor || !data.monto || data.monto <= 0 || !data.fecha_pedido || !data.fecha_llegada_estimada || !data.hora_llegada_estimada) {
      showToast('Por favor completa todos los campos obligatorios', 'warning');
      return;
    }

    try {
      if (this.editandoId) {
        await Api.updatePedido(this.editandoId, {
          proveedor: data.proveedor,
          descripcion: data.descripcion,
          monto: data.monto,
          fecha_llegada_estimada: data.fecha_llegada_estimada,
          hora_llegada_estimada: data.hora_llegada_estimada,
        });
        showToast('Pedido actualizado correctamente', 'success');
      } else {
        await Api.createPedido(data);
        showToast('Pedido registrado correctamente', 'success');
      }
      cerrarModal();
      this.cargar();
      Dashboard.cargar();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  },

  mostrarConfirmacion(id) {
    const pedido = this.datos.find(p => p.id === id);
    if (!pedido) return;

    document.getElementById('notif-title').textContent = `¿Recibiste el pedido del proveedor ${pedido.proveedor}?`;
    document.getElementById('notif-detail').textContent = pedido.descripcion || 'Sin descripción';
    document.getElementById('notif-monto').textContent = formatMoney(pedido.monto);

    document.getElementById('notif-btn-si').onclick = () => this.confirmar(id, true);
    document.getElementById('notif-btn-no').onclick = () => this.confirmar(id, false);

    document.getElementById('notification-popup').classList.remove('hidden');
  },

  async confirmar(id, recibido) {
    try {
      await Api.confirmarPedido(id, recibido);
      document.getElementById('notification-popup').classList.add('hidden');

      if (recibido) {
        showToast('Pedido confirmado y registrado en gastos automáticamente', 'success');
      } else {
        showToast('Pedido marcado como no recibido', 'info');
      }

      this.cargar();
      Dashboard.cargar();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  },

  async verificarNotificaciones() {
    try {
      const data = await Api.getPedidosPorVencer();
      this.notificacionesPendientes = data.notificaciones || [];
      this.renderNotificaciones();
    } catch (err) {
      console.error('Error verificando notificaciones:', err);
    }
  },

  renderNotificaciones() {
    const container = document.getElementById('notif-pedidos-container');
    if (this.notificacionesPendientes.length === 0) {
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');
    container.innerHTML = this.notificacionesPendientes.map(n => `
      <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between animate-fade-in">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
            <i class="fas fa-bell text-yellow-600"></i>
          </div>
          <div>
            <p class="font-medium text-gray-800">${escapeHtml(n.mensaje)}</p>
            <p class="text-xs text-gray-500">Monto: ${formatMoney(n.monto)} | Estimado: ${n.fecha_llegada_estimada} ${n.hora_llegada_estimada}</p>
          </div>
        </div>
        <div class="flex gap-2 flex-shrink-0 ml-3">
          <button onclick="Pedidos.confirmar(${n.pedido_id}, false)" class="btn-danger btn-sm">No</button>
          <button onclick="Pedidos.confirmar(${n.pedido_id}, true)" class="btn-success btn-sm">Sí</button>
        </div>
      </div>
    `).join('');
  },

  async eliminar(id) {
    if (!confirm('¿Estás seguro de eliminar este pedido?')) return;
    try {
      await Api.deletePedido(id);
      showToast('Pedido eliminado', 'info');
      this.cargar();
      Dashboard.cargar();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  },
};
