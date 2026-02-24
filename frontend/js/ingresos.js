/**
 * Módulo Ingresos - CRUD de ingresos con filtrado.
 */
const Ingresos = {
  datos: [],
  editandoId: null,

  async cargar() {
    try {
      this.datos = await Api.getIngresos();
      this.renderTabla();
    } catch (err) {
      showToast('Error cargando ingresos: ' + err.message, 'error');
    }
  },

  async filtrar() {
    const fecha = document.getElementById('filtro-ing-fecha').value;
    const params = {};
    if (fecha) params.fecha = fecha;
    try {
      this.datos = await Api.getIngresos(params);
      this.renderTabla();
    } catch (err) {
      showToast('Error filtrando: ' + err.message, 'error');
    }
  },

  limpiarFiltro() {
    document.getElementById('filtro-ing-fecha').value = '';
    this.cargar();
  },

  renderTabla() {
    const tbody = document.getElementById('tabla-ingresos');
    if (this.datos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-gray-400"><i class="fas fa-inbox text-3xl mb-2 block"></i>No hay ingresos registrados</td></tr>';
      document.getElementById('total-ingresos').textContent = '$0';
      return;
    }

    let total = 0;
    tbody.innerHTML = this.datos.map(ing => {
      total += ing.monto;
      return `
        <tr class="animate-fade-in">
          <td class="px-4 py-3 text-gray-600">${formatDate(ing.fecha)}</td>
          <td class="px-4 py-3 text-gray-800">${escapeHtml(ing.descripcion)}</td>
          <td class="px-4 py-3 text-right font-semibold text-green-600">${formatMoney(ing.monto)}</td>
          <td class="px-4 py-3 text-center">
            <button onclick="Ingresos.abrirModal(${ing.id})" class="text-primary-600 hover:text-primary-800 mr-2" title="Editar">
              <i class="fas fa-pen-to-square"></i>
            </button>
            <button onclick="Ingresos.eliminar(${ing.id})" class="text-red-500 hover:text-red-700" title="Eliminar">
              <i class="fas fa-trash-can"></i>
            </button>
          </td>
        </tr>`;
    }).join('');

    document.getElementById('total-ingresos').textContent = formatMoney(total);
  },

  abrirModal(id = null) {
    this.editandoId = id;
    const ing = id ? this.datos.find(i => i.id === id) : null;

    document.getElementById('modal-title').textContent = id ? 'Editar Ingreso' : 'Nuevo Ingreso';
    document.getElementById('modal-body').innerHTML = `
      <div class="space-y-4">
        <div>
          <label class="input-label">Fecha</label>
          <input type="date" id="form-ing-fecha" class="input-field" 
                 value="${ing ? ing.fecha : new Date().toISOString().split('T')[0]}" required />
        </div>
        <div>
          <label class="input-label">Descripción</label>
          <input type="text" id="form-ing-desc" class="input-field" placeholder="Ej: Ventas del día" 
                 value="${ing ? escapeHtml(ing.descripcion) : ''}" required />
        </div>
        <div>
          <label class="input-label">Monto ($)</label>
          <input type="number" id="form-ing-monto" class="input-field" placeholder="0.00" step="0.01" min="0.01"
                 value="${ing ? ing.monto : ''}" required />
        </div>
      </div>`;

    document.getElementById('modal-footer').innerHTML = `
      <button onclick="cerrarModal()" class="btn-secondary">Cancelar</button>
      <button onclick="Ingresos.guardar()" class="btn-primary"><i class="fas fa-floppy-disk mr-2"></i>Guardar</button>`;

    abrirModal();
  },

  async guardar() {
    const data = {
      fecha: document.getElementById('form-ing-fecha').value,
      descripcion: document.getElementById('form-ing-desc').value.trim(),
      monto: parseFloat(document.getElementById('form-ing-monto').value),
    };

    if (!data.fecha || !data.descripcion || !data.monto || data.monto <= 0) {
      showToast('Por favor completa todos los campos correctamente', 'warning');
      return;
    }

    try {
      if (this.editandoId) {
        await Api.updateIngreso(this.editandoId, data);
        showToast('Ingreso actualizado correctamente', 'success');
      } else {
        await Api.createIngreso(data);
        showToast('Ingreso registrado correctamente', 'success');
      }
      cerrarModal();
      this.cargar();
      Dashboard.cargar();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  },

  async eliminar(id) {
    if (!confirm('¿Estás seguro de eliminar este ingreso?')) return;
    try {
      await Api.deleteIngreso(id);
      showToast('Ingreso eliminado', 'info');
      this.cargar();
      Dashboard.cargar();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  },
};
