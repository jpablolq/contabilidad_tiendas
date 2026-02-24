/**
 * Módulo Gastos - CRUD de gastos con categorías y filtrado.
 */
const Gastos = {
  datos: [],
  editandoId: null,

  async cargar() {
    try {
      this.datos = await Api.getGastos();
      this.renderTabla();
    } catch (err) {
      showToast('Error cargando gastos: ' + err.message, 'error');
    }
  },

  async filtrar() {
    const fecha = document.getElementById('filtro-gas-fecha').value;
    const categoria = document.getElementById('filtro-gas-categoria').value;
    const params = {};
    if (fecha) params.fecha = fecha;
    if (categoria) params.categoria = categoria;
    try {
      this.datos = await Api.getGastos(params);
      this.renderTabla();
    } catch (err) {
      showToast('Error filtrando: ' + err.message, 'error');
    }
  },

  limpiarFiltro() {
    document.getElementById('filtro-gas-fecha').value = '';
    document.getElementById('filtro-gas-categoria').value = '';
    this.cargar();
  },

  renderTabla() {
    const tbody = document.getElementById('tabla-gastos');
    if (this.datos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-400"><i class="fas fa-inbox text-3xl mb-2 block"></i>No hay gastos registrados</td></tr>';
      document.getElementById('total-gastos').textContent = '$0';
      return;
    }

    let total = 0;
    tbody.innerHTML = this.datos.map(gas => {
      total += gas.monto;
      return `
        <tr class="animate-fade-in">
          <td class="px-4 py-3 text-gray-600">${formatDate(gas.fecha)}</td>
          <td class="px-4 py-3 text-gray-800">${escapeHtml(gas.descripcion)}</td>
          <td class="px-4 py-3"><span class="badge ${getCategoryBadgeClass(gas.categoria)}">${getCategoryLabel(gas.categoria)}</span></td>
          <td class="px-4 py-3 text-right font-semibold text-red-600">${formatMoney(gas.monto)}</td>
          <td class="px-4 py-3 text-center">
            <button onclick="Gastos.abrirModal(${gas.id})" class="text-primary-600 hover:text-primary-800 mr-2" title="Editar">
              <i class="fas fa-pen-to-square"></i>
            </button>
            <button onclick="Gastos.eliminar(${gas.id})" class="text-red-500 hover:text-red-700" title="Eliminar">
              <i class="fas fa-trash-can"></i>
            </button>
          </td>
        </tr>`;
    }).join('');

    document.getElementById('total-gastos').textContent = formatMoney(total);
  },

  abrirModal(id = null) {
    this.editandoId = id;
    const gas = id ? this.datos.find(g => g.id === id) : null;

    document.getElementById('modal-title').textContent = id ? 'Editar Gasto' : 'Nuevo Gasto';
    document.getElementById('modal-body').innerHTML = `
      <div class="space-y-4">
        <div>
          <label class="input-label">Fecha</label>
          <input type="date" id="form-gas-fecha" class="input-field" 
                 value="${gas ? gas.fecha : new Date().toISOString().split('T')[0]}" required />
        </div>
        <div>
          <label class="input-label">Descripción</label>
          <input type="text" id="form-gas-desc" class="input-field" placeholder="Ej: Compra de papel"
                 value="${gas ? escapeHtml(gas.descripcion) : ''}" required />
        </div>
        <div>
          <label class="input-label">Categoría</label>
          <select id="form-gas-cat" class="input-field">
            <option value="pedidos_proveedores" ${gas?.categoria === 'pedidos_proveedores' ? 'selected' : ''}>Pedidos a Proveedores</option>
            <option value="utiles" ${gas?.categoria === 'utiles' ? 'selected' : ''}>Compra de Útiles</option>
            <option value="medicamentos" ${gas?.categoria === 'medicamentos' ? 'selected' : ''}>Medicamentos</option>
            <option value="consumo" ${gas?.categoria === 'consumo' ? 'selected' : ''}>Consumo</option>
            <option value="otros" ${!gas || gas.categoria === 'otros' ? 'selected' : ''}>Otros</option>
          </select>
        </div>
        <div>
          <label class="input-label">Monto ($)</label>
          <input type="number" id="form-gas-monto" class="input-field" placeholder="0.00" step="0.01" min="0.01"
                 value="${gas ? gas.monto : ''}" required />
        </div>
      </div>`;

    document.getElementById('modal-footer').innerHTML = `
      <button onclick="cerrarModal()" class="btn-secondary">Cancelar</button>
      <button onclick="Gastos.guardar()" class="btn-primary"><i class="fas fa-floppy-disk mr-2"></i>Guardar</button>`;

    abrirModal();
  },

  async guardar() {
    const data = {
      fecha: document.getElementById('form-gas-fecha').value,
      descripcion: document.getElementById('form-gas-desc').value.trim(),
      categoria: document.getElementById('form-gas-cat').value,
      monto: parseFloat(document.getElementById('form-gas-monto').value),
    };

    if (!data.fecha || !data.descripcion || !data.monto || data.monto <= 0) {
      showToast('Por favor completa todos los campos correctamente', 'warning');
      return;
    }

    try {
      if (this.editandoId) {
        await Api.updateGasto(this.editandoId, data);
        showToast('Gasto actualizado correctamente', 'success');
      } else {
        await Api.createGasto(data);
        showToast('Gasto registrado correctamente', 'success');
      }
      cerrarModal();
      this.cargar();
      Dashboard.cargar();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  },

  async eliminar(id) {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return;
    try {
      await Api.deleteGasto(id);
      showToast('Gasto eliminado', 'info');
      this.cargar();
      Dashboard.cargar();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  },
};
