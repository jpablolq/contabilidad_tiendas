/**
 * App Principal - Navegación SPA, utilidades globales, inicialización.
 */

// ═══════════════════ UTILIDADES ═══════════════════

function formatMoney(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getCategoryLabel(cat) {
  const labels = {
    pedidos_proveedores: 'Proveedores',
    utiles: 'Útiles',
    medicamentos: 'Medicamentos',
    otros: 'Otros',
  };
  return labels[cat] || cat;
}

function getCategoryBadgeClass(cat) {
  const classes = {
    pedidos_proveedores: 'badge-proveedores',
    utiles: 'badge-utiles',
    medicamentos: 'badge-medicamentos',
    otros: 'badge-otros',
  };
  return classes[cat] || 'badge-otros';
}

// ═══════════════════ TOAST NOTIFICATIONS ═══════════════════

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-circle-exclamation',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ═══════════════════ MODAL ═══════════════════

function abrirModal() {
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function cerrarModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

// Close modal on overlay click
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) cerrarModal();
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    cerrarModal();
    document.getElementById('notification-popup').classList.add('hidden');
  }
});

// ═══════════════════ SIDEBAR / NAVIGATION ═══════════════════

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  sidebar.classList.toggle('-translate-x-full');
  overlay.classList.toggle('hidden');
}

document.getElementById('btn-sidebar-toggle').addEventListener('click', toggleSidebar);

// Pagenames / titles
const pageTitles = {
  dashboard: 'Dashboard',
  ingresos: 'Gestión de Ingresos',
  gastos: 'Gestión de Gastos',
  pedidos: 'Pedidos Pendientes',
  reportes: 'Reportes y Exportar',
};

function navigateTo(page) {
  // Hide all sections
  document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
  // Show target
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.remove('hidden');

  // Update nav links
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

  // Update title
  document.getElementById('page-title').textContent = pageTitles[page] || page;

  // Load data for the page
  switch (page) {
    case 'dashboard': Dashboard.cargar(); break;
    case 'ingresos': Ingresos.cargar(); break;
    case 'gastos': Gastos.cargar(); break;
    case 'pedidos': Pedidos.cargar(); break;
    case 'reportes': Reportes.init(); break;
  }

  // Close mobile sidebar
  const sidebar = document.getElementById('sidebar');
  if (!sidebar.classList.contains('-translate-x-full') && window.innerWidth < 1024) {
    toggleSidebar();
  }
}

// Nav click handlers
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const page = link.dataset.page;
    if (page) navigateTo(page);
  });
});

// Notification bell click → go to pedidos
document.getElementById('btn-notificaciones').addEventListener('click', () => {
  navigateTo('pedidos');
});

// Checkbox filter for pedidos
document.getElementById('filtro-solo-pendientes').addEventListener('change', () => {
  Pedidos.cargar();
});

// ═══════════════════ DATE DISPLAY ═══════════════════

function updateDate() {
  const now = new Date();
  document.getElementById('fecha-actual').textContent = now.toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ═══════════════════ NOTIFICATION POLLING ═══════════════════

let notifInterval = null;

function startNotificationPolling() {
  // Check every 60 seconds
  notifInterval = setInterval(async () => {
    try {
      const data = await Api.getPedidosPorVencer();
      if (data.total_notificaciones > 0) {
        document.getElementById('badge-notif').textContent = data.total_notificaciones;
        document.getElementById('badge-notif').classList.remove('hidden');
        document.getElementById('badge-pedidos').textContent = data.total_notificaciones;
        document.getElementById('badge-pedidos').classList.remove('hidden');

        // Show first pending notification popup
        if (data.notificaciones.length > 0) {
          const n = data.notificaciones[0];
          document.getElementById('notif-title').textContent = n.mensaje;
          document.getElementById('notif-detail').textContent = n.descripcion || `Llegada estimada: ${n.fecha_llegada_estimada} ${n.hora_llegada_estimada}`;
          document.getElementById('notif-monto').textContent = formatMoney(n.monto);
          document.getElementById('notif-btn-si').onclick = () => Pedidos.confirmar(n.pedido_id, true);
          document.getElementById('notif-btn-no').onclick = () => Pedidos.confirmar(n.pedido_id, false);
          document.getElementById('notification-popup').classList.remove('hidden');
        }
      } else {
        document.getElementById('badge-notif').classList.add('hidden');
        document.getElementById('badge-pedidos').classList.add('hidden');
      }
    } catch (err) {
      console.error('Error polling notificaciones:', err);
    }
  }, 60000);
}

// ═══════════════════ INIT ═══════════════════

document.addEventListener('DOMContentLoaded', () => {
  updateDate();
  navigateTo('dashboard');
  startNotificationPolling();
});
