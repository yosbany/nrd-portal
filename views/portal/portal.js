// Portal view - Displays available NRD applications

const logger = window.logger || console;

// Detect if we're on localhost
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname === '0.0.0.0';

// Apps disponibles con URLs locales y remotas
const APPS_CONFIG = [
  { name: "Pedidos", localPath: "/nrd-pedidos/", remoteUrl: "https://yosbany.github.io/nrd-pedidos", icon: "📦" },
  { name: "Gestión Operativa", localPath: "/nrd-gestion-operativa/", remoteUrl: "https://yosbany.github.io/nrd-gestion-operativa", icon: "⚙️" },
  { name: "Flujo de Caja", localPath: "/nrd-flujo-caja/", remoteUrl: "https://yosbany.github.io/nrd-flujo-caja", icon: "💰" },
  { name: "Control de Cajas", localPath: "/nrd-control-cajas/", remoteUrl: "https://yosbany.github.io/nrd-control-cajas", icon: "📊" },
  { name: "Costos", localPath: "/nrd-costos/", remoteUrl: "https://yosbany.github.io/nrd-costos", icon: "💵" },
  { name: "RRHH", localPath: "/nrd-rrhh/", remoteUrl: "https://yosbany.github.io/nrd-rrhh", icon: "👥" },
  { name: "Productos", localPath: "/nrd-productos/", remoteUrl: "https://yosbany.github.io/nrd-productos", icon: "📋" },
  { name: "Compras", localPath: "/nrd-compras/", remoteUrl: "https://yosbany.github.io/nrd-compras", icon: "🛒" },
  { name: "Catálogo", localPath: "/nrd-catalogo/", remoteUrl: "https://yosbany.github.io/nrd-catalogo", icon: "📚" },
  { name: "Web", localPath: "/nrd-web/", remoteUrl: "https://web.nrdonline.site/", icon: "🌐" },
  { name: "Administración de Datos", localPath: "/nrd-data-access/", remoteUrl: "https://yosbany.github.io/nrd-data-access", icon: "🗄️" }
];

// Generate APPS array with correct URLs based on environment
const APPS = APPS_CONFIG.map(app => ({
  name: app.name,
  url: isLocalhost ? app.localPath : app.remoteUrl,
  icon: app.icon
}));

/**
 * Initialize Inicio view (apps grid)
 */
export function initializeInicio() {
  logger.debug('Initializing inicio view');
  renderApps();
}

const CALC_SUB_TABS = [
  { id: 'precio-venta', label: 'Precio de venta' },
  { id: 'mano-obra', label: 'Costo mano de obra' },
  { id: 'gf-por-hora', label: 'Gastos fijos por hora' }
];

let currentCalcTab = 'precio-venta';

/**
 * Initialize Calculadoras view
 */
export function initializeCalculadoras() {
  logger.debug('Initializing calculadoras view');
  setupCalculadorasSubNav();
  renderCalculatorContent(currentCalcTab);
}

function setupCalculadorasSubNav() {
  const subNav = document.getElementById('calculadoras-sub-nav');
  if (!subNav) return;

  subNav.querySelectorAll('.calc-sub-btn').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });

  subNav.querySelectorAll('.calc-sub-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const calcId = btn.dataset.calc;
      if (!calcId) return;
      currentCalcTab = calcId;
      updateCalcSubNavActive(calcId);
      renderCalculatorContent(calcId);
    });
  });
}

function updateCalcSubNavActive(activeId) {
  document.querySelectorAll('.calc-sub-btn').forEach(btn => {
    const isActive = btn.dataset.calc === activeId;
    btn.classList.toggle('border-red-600', isActive);
    btn.classList.toggle('text-red-600', isActive);
    btn.classList.toggle('font-medium', isActive);
    btn.classList.toggle('border-transparent', !isActive);
    btn.classList.toggle('text-gray-600', !isActive);
  });
}

function renderCalculatorContent(calcId, options = {}) {
  const container = document.getElementById('calculadoras-content');
  if (!container) return;

  if (calcId === 'gf-por-hora' && !options.skipLoad) {
    const saved = loadFromStorage(LS_KEY_GF);
    if (saved && saved.gastos && Array.isArray(saved.gastos) && saved.gastos.length > 0) {
      gfPorHoraGastos = saved.gastos.map((g, i) => ({
        id: g.id ?? i + 1,
        nombre: g.nombre ?? '',
        monto: g.monto ?? 0,
        porcentaje: (g.porcentaje !== undefined && g.porcentaje !== '') ? g.porcentaje : 100
      }));
    }
  }

  if (calcId === 'precio-venta') {
    container.innerHTML = getPrecioVentaCalculatorHTML();
    setupPrecioVentaHandlers();
  } else if (calcId === 'mano-obra') {
    if (!options.skipLoad) {
      const saved = loadFromStorage(LS_KEY_MO);
      if (saved && saved.empleados && Array.isArray(saved.empleados) && saved.empleados.length > 0) {
        moEmpleados = saved.empleados.map((e, i) => {
          const sd = e.sueldoDeclarado;
          return {
            id: e.id ?? i + 1,
            nombre: e.nombre ?? '',
            sueldoBase: e.sueldoBase ?? 0,
            sueldoDeclarado: (sd !== undefined && sd !== null && String(sd).trim() !== '') ? sd : null,
            horasPorDia: e.horasPorDia ?? 8,
            diasPorMes: e.diasPorMes ?? 26
          };
        });
      }
    }
    container.innerHTML = getManoObraCalculatorHTML();
    setupManoObraHandlers();
  } else if (calcId === 'gf-por-hora') {
    let preservedHoras = options.preservedHoras;
    if (preservedHoras == null) {
      const saved = loadFromStorage(LS_KEY_GF);
      preservedHoras = (saved && saved.horas != null && saved.horas !== '') ? String(saved.horas) : '';
    }
    container.innerHTML = getGFPorHoraCalculatorHTML(preservedHoras || undefined);
    setupGFPorHoraHandlers(preservedHoras ? { preservedHoras } : null);
  }
}

const LS_KEY_PV = 'nrd-portal-calc-precio-venta';
const LS_KEY_MO = 'nrd-portal-calc-mano-obra';
const LS_KEY_GF = 'nrd-portal-calc-gf-por-hora';

function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    logger.warn('Failed to save to localStorage', e);
  }
}

function getPrecioVentaCalculatorHTML() {
  const saved = loadFromStorage(LS_KEY_PV) || {};
  return `
    <div class="bg-white border border-gray-200 shadow-sm overflow-hidden w-full">
      <div class="bg-red-50 border-b border-red-100 px-4 sm:px-6 py-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div class="flex-1">
            <h3 class="text-base font-medium text-red-800 mb-1">Precio de venta</h3>
            <p class="text-sm text-red-900/80">Ingrese el importe total, la cantidad de unidades y el margen deseado sobre venta.</p>
          </div>
          <div class="flex-shrink-0 flex gap-2">
            <button type="button" id="calc-pv-limpiar" class="px-3 py-2 text-sm border border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 uppercase tracking-wider transition-colors">Limpiar</button>
          </div>
        </div>
      </div>
      <div class="p-4 sm:p-6 space-y-4">
        <div class="bg-blue-50 border border-blue-100 rounded px-4 py-4 space-y-4">
          <p class="text-xs uppercase tracking-wider text-blue-900/80 font-medium mb-3">Datos de entrada</p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs uppercase tracking-wider text-blue-900/70 font-medium mb-1.5">Precio de compra ($)</label>
              <div class="flex items-center gap-2">
                <input type="number" id="calc-pv-precio-compra" step="0.01" min="0" placeholder="0.00" value="${saved.precioCompra ?? saved.importe ?? ''}"
                  class="flex-1 px-3 py-2 border border-blue-200 bg-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30">
                <label class="flex items-center gap-1.5 whitespace-nowrap text-sm text-blue-900/80 cursor-pointer">
                  <input type="checkbox" id="calc-pv-con-impuesto" ${saved.conImpuesto ? 'checked' : ''}
                    class="rounded border-blue-300 text-blue-600 focus:ring-blue-500/30">
                  Con impuesto
                </label>
              </div>
              <div id="calc-pv-iva-container" class="mt-2 ${saved.conImpuesto ? '' : 'hidden'}">
                <label class="block text-xs text-blue-900/70 mb-1">IVA</label>
                <select id="calc-pv-iva" class="w-full px-3 py-2 border border-blue-200 bg-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30">
                  <option value="10" ${String(saved.iva ?? 22) === '10' ? 'selected' : ''}>10%</option>
                  <option value="22" ${String(saved.iva ?? 22) === '22' ? 'selected' : ''}>22%</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs uppercase tracking-wider text-blue-900/70 font-medium mb-1.5">Cantidad</label>
              <input type="number" id="calc-pv-cantidad" step="1" min="1" placeholder="1" value="${saved.cantidad !== undefined && saved.cantidad !== '' ? saved.cantidad : '1'}"
                class="w-full px-3 py-2 border border-blue-200 bg-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30">
            </div>
            <div>
              <label class="block text-xs uppercase tracking-wider text-blue-900/70 font-medium mb-1.5">Por ciento (%)</label>
              <input type="number" id="calc-pv-porcentaje" step="0.01" min="0" max="100" placeholder="25" value="${saved.porcentaje !== undefined && saved.porcentaje !== '' ? saved.porcentaje : '25'}"
                class="w-full px-3 py-2 border border-blue-200 bg-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30">
            </div>
          </div>
        </div>
        <div id="calc-pv-resultado" class="bg-purple-50 border border-purple-100 rounded px-4 py-4 space-y-3">
          <p class="text-xs uppercase tracking-wider text-purple-900/80 font-medium mb-2">Resultados</p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs uppercase tracking-wider text-purple-900/70 font-medium mb-1">Costo unitario $</label>
              <p id="calc-pv-costo-unitario" class="text-lg font-medium text-purple-900">—</p>
            </div>
            <div>
              <label class="block text-xs uppercase tracking-wider text-purple-900/70 font-medium mb-1">Ganancia $</label>
              <p id="calc-pv-ganancia" class="text-lg font-medium text-purple-900">—</p>
            </div>
            <div>
              <label class="block text-xs uppercase tracking-wider text-purple-900/70 font-medium mb-1">Precio de venta $</label>
              <p id="calc-pv-precio" class="text-2xl font-bold text-green-600">—</p>
            </div>
          </div>
        </div>
        <div class="pt-2">
          <button type="button" id="calc-pv-imprimir" class="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 uppercase tracking-wider transition-colors">
            Imprimir
          </button>
        </div>
      </div>
    </div>
  `;
}

let moEmpleados = [{ id: 1, nombre: '', sueldoBase: 0, sueldoDeclarado: null, horasPorDia: 8, diasPorMes: 26 }];
let moListenersSetup = false;

function getManoObraCalculatorHTML() {
  const esc = (t) => {
    if (t == null || t === '') return '';
    const d = document.createElement('div');
    d.textContent = String(t);
    return d.innerHTML;
  };
  const formatCur = (n) => `$${Number(n).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const canRemove = moEmpleados.length > 1;

  const calcRow = (e) => {
    const sb = parseFloat(e.sueldoBase) || 0;
    const sdRaw = e.sueldoDeclarado;
    const sdVal = (sdRaw !== undefined && sdRaw !== null && String(sdRaw).trim() !== '')
      ? (parseFloat(sdRaw) || 0) : 0;
    const aportes = sdVal > 0 ? Math.round(sdVal * 0.15) : 0;
    const aguinaldo = Math.round(sb * 0.0833);
    const licencia = Math.round(sb * 0.0909);
    const costoReal = sb + aportes + aguinaldo + licencia;
    const hpd = parseFloat(e.horasPorDia) || 0;
    const dpm = parseFloat(e.diasPorMes) || 0;
    const horasMens = Math.round(hpd * dpm);
    return { aportes, aguinaldo, licencia, costoReal, horasMens };
  };

  const rowsHtml = moEmpleados.map((e) => {
    const c = calcRow(e);
    return `
      <tr class="mo-row border-b border-gray-100" data-row-id="${e.id}">
        <td class="py-2 pr-2"><input type="text" class="mo-nombre w-full min-w-0 px-2 py-1.5 border border-gray-300 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500/30" placeholder="Empleado" value="${esc(e.nombre)}" data-row-id="${e.id}"></td>
        <td class="py-2 px-2"><input type="number" class="mo-sueldo w-24 px-2 py-1.5 border border-gray-300 text-sm text-right focus:border-red-500 focus:ring-1 focus:ring-red-500/30" step="1" min="0" placeholder="0" value="${e.sueldoBase ?? ''}" data-row-id="${e.id}"></td>
        <td class="py-2 px-2"><input type="number" class="mo-sueldo-declarado w-24 px-2 py-1.5 border border-gray-300 text-sm text-right focus:border-red-500 focus:ring-1 focus:ring-red-500/30" step="1" min="0" placeholder="—" value="${(e.sueldoDeclarado !== undefined && e.sueldoDeclarado !== null && String(e.sueldoDeclarado).trim() !== '') ? e.sueldoDeclarado : ''}" data-row-id="${e.id}"></td>
        <td class="py-2 px-2 text-right text-sm mo-aportes">${formatCur(c.aportes)}</td>
        <td class="py-2 px-2 text-right text-sm mo-aguinaldo">${formatCur(c.aguinaldo)}</td>
        <td class="py-2 px-2 text-right text-sm mo-licencia">${formatCur(c.licencia)}</td>
        <td class="py-2 px-2 text-right text-sm font-medium mo-costo-real">${formatCur(c.costoReal)}</td>
        <td class="py-2 px-2"><input type="number" class="mo-horas-dia w-16 px-2 py-1.5 border border-gray-300 text-sm text-right focus:border-red-500 focus:ring-1 focus:ring-red-500/30" step="0.5" min="0" placeholder="8" value="${e.horasPorDia ?? 8}" data-row-id="${e.id}"></td>
        <td class="py-2 px-2"><input type="number" class="mo-dias-mes w-16 px-2 py-1.5 border border-gray-300 text-sm text-right focus:border-red-500 focus:ring-1 focus:ring-red-500/30" step="1" min="0" placeholder="26" value="${e.diasPorMes ?? 26}" data-row-id="${e.id}"></td>
        <td class="py-2 px-2 text-right text-sm font-medium mo-horas-mens">${c.horasMens}</td>
        <td class="py-2 pl-2 w-12"><button type="button" class="mo-remove text-red-600 hover:text-red-700 text-lg font-light w-8 h-8 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed" data-row-id="${e.id}" title="Eliminar" ${!canRemove ? 'disabled' : ''}>×</button></td>
      </tr>
    `;
  }).join('');

  return `
    <div class="bg-white border border-gray-200 shadow-sm overflow-hidden w-full">
      <div class="bg-red-50 border-b border-red-100 px-4 sm:px-6 py-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div class="flex-1">
            <h3 class="text-base font-medium text-red-800 mb-1">Costo de mano de obra</h3>
            <p class="text-sm text-red-900/80">Ingrese los empleados con sueldos, aportes patronales (15%), aguinaldo (8,33%) y licencia (9,09%). El costo por hora se calcula a partir del costo mensual real y las horas mensuales.</p>
          </div>
          <div class="flex-shrink-0">
            <button type="button" id="calc-mo-limpiar" class="px-3 py-2 text-sm border border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 uppercase tracking-wider transition-colors">Limpiar</button>
          </div>
        </div>
      </div>
      <div class="p-4 sm:p-6 space-y-4">
        <div class="flex justify-end mb-2">
          <button type="button" id="mo-add-row" class="text-red-600 hover:text-red-700 hover:underline text-sm font-medium transition-colors">+ Agregar empleado</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[900px] text-sm">
            <thead>
              <tr class="border-b-2 border-red-200 bg-red-50/50 text-left text-xs uppercase tracking-wider text-red-900/90">
                <th class="py-2.5 pr-2 font-medium">Empleado</th>
                <th class="py-2.5 px-2 font-medium text-right">Sueldo Base</th>
                <th class="py-2.5 px-2 font-medium text-right">Sueldo declarado</th>
                <th class="py-2.5 px-2 font-medium text-right"><span class="block whitespace-nowrap">Patronales + BSE</span><span class="block font-normal text-red-900/70">(15%)</span></th>
                <th class="py-2.5 px-2 font-medium text-right">Aguinaldo (8,33%)</th>
                <th class="py-2.5 px-2 font-medium text-right">Licencia + SV (9,09%)</th>
                <th class="py-2.5 px-2 font-medium text-right">Costo Mensual Real</th>
                <th class="py-2.5 px-2 font-medium text-right">Horas/Día</th>
                <th class="py-2.5 px-2 font-medium text-right">Días/Mes</th>
                <th class="py-2.5 px-2 font-medium text-right">Horas Mensuales</th>
                <th class="py-2.5 pl-2 w-12"></th>
              </tr>
            </thead>
            <tbody id="mo-empleados-tbody">
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr class="border-t-2 border-red-200 bg-red-50/30 font-medium">
                <td class="py-2.5 pr-2">TOTAL</td>
                <td class="py-2.5 px-2"></td>
                <td class="py-2.5 px-2"></td>
                <td class="py-2.5 px-2"></td>
                <td class="py-2.5 px-2"></td>
                <td class="py-2.5 px-2"></td>
                <td id="mo-total-costo" class="py-2.5 px-2 text-right"></td>
                <td class="py-2.5 px-2"></td>
                <td class="py-2.5 px-2"></td>
                <td id="mo-total-horas" class="py-2.5 px-2 text-right"></td>
                <td class="py-2.5 pl-2"></td>
              </tr>
              <tr class="border-t border-gray-200">
                <td colspan="9" class="py-2.5 pr-2 text-right text-sm text-gray-600">Costo Hora:</td>
                <td id="mo-costo-hora" class="py-2.5 px-2 text-right text-xl font-medium text-red-600" colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="pt-4 border-t border-gray-200">
          <button type="button" id="calc-mo-imprimir" class="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 uppercase tracking-wider transition-colors">
            Imprimir
          </button>
        </div>
      </div>
    </div>
  `;
}

let gfPorHoraGastos = [{ id: 1, nombre: '', monto: 0, porcentaje: 100 }];
let gfPorHoraListenersSetup = false;

function getGFPorHoraCalculatorHTML(initialHoras) {
  const esc = (t) => {
    if (t == null || t === '') return '';
    const d = document.createElement('div');
    d.textContent = String(t);
    return d.innerHTML;
  };
  const canRemove = gfPorHoraGastos.length > 1;
  const formatCur = (n) => `$${Number(n).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const pct = (g) => (g.porcentaje !== undefined && g.porcentaje !== '' ? Number(g.porcentaje) : 100);
  const subtotal = (g) => (parseFloat(g.monto) || 0) * (pct(g) / 100);
  const rowsHtml = gfPorHoraGastos.map((g) => `
    <tr class="gf-row border-b border-gray-100" data-row-id="${g.id}">
      <td class="py-2 pr-2 align-top"><input type="text" class="gf-nombre w-full min-w-0 px-2 py-1.5 border border-gray-300 rounded text-sm box-border focus:border-red-500 focus:ring-1 focus:ring-red-500/30" placeholder="Ej: Arriendo" value="${esc(g.nombre)}" data-row-id="${g.id}"></td>
      <td class="py-2 px-2 align-top"><input type="number" class="gf-monto w-full min-w-0 px-2 py-1.5 border border-gray-300 rounded text-sm text-right box-border focus:border-red-500 focus:ring-1 focus:ring-red-500/30" step="0.01" min="0" placeholder="0" value="${g.monto || ''}" data-row-id="${g.id}"></td>
      <td class="py-2 px-2 align-top"><input type="number" class="gf-pct w-full min-w-0 px-2 py-1.5 border border-gray-300 rounded text-sm text-right box-border focus:border-red-500 focus:ring-1 focus:ring-red-500/30" step="0.01" min="0" max="100" placeholder="100" value="${g.porcentaje !== undefined && g.porcentaje !== '' ? g.porcentaje : '100'}" data-row-id="${g.id}"></td>
      <td class="py-2 px-2 align-middle text-right font-medium text-red-700 gf-subtotal-cell">${formatCur(subtotal(g))}</td>
      <td class="py-2 pl-2 align-top w-12"><button type="button" class="gf-remove text-red-600 hover:text-red-700 text-lg font-light w-8 h-8 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed" data-row-id="${g.id}" title="Eliminar" ${!canRemove ? 'disabled' : ''}>×</button></td>
    </tr>
  `).join('');

  return `
    <div class="bg-white border border-gray-200 shadow-sm overflow-hidden w-full">
      <div class="bg-red-50 border-b border-red-100 px-4 sm:px-6 py-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div class="flex-1">
            <h3 class="text-base font-medium text-red-800 mb-1">Gastos fijos por hora</h3>
            <p class="text-sm text-red-900/80">Ingrese sus gastos mensuales fijos y el porcentaje aplicable. Luego indique las horas del mes para obtener el costo por hora.</p>
          </div>
          <div class="flex-shrink-0">
            <button type="button" id="gf-limpiar" class="px-3 py-2 text-sm border border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 rounded uppercase tracking-wider transition-colors">Limpiar</button>
          </div>
        </div>
      </div>
      <div class="p-4 sm:p-6 space-y-4 w-full">
        <div class="flex justify-end mb-2">
          <button type="button" id="gf-add-row" class="text-red-600 hover:text-red-700 hover:underline text-sm font-medium transition-colors">
            + Agregar gasto
          </button>
        </div>
        <div class="w-full overflow-x-auto">
          <table class="w-full min-w-full text-sm table-fixed">
            <colgroup>
              <col style="width:40%">
              <col style="width:20%">
              <col style="width:12%">
              <col style="width:22%">
              <col style="width:48px">
            </colgroup>
            <thead>
              <tr class="border-b-2 border-red-200 bg-red-50/50 text-left text-xs uppercase tracking-wider text-red-900/90">
                <th class="py-2.5 pr-2 font-medium">Nombre del gasto</th>
                <th class="py-2.5 px-2 font-medium">Monto mensual ($)</th>
                <th class="py-2.5 px-2 font-medium">% aplicable</th>
                <th class="py-2.5 px-2 font-medium text-right">Subtotal</th>
                <th class="py-2.5 pl-2"></th>
              </tr>
            </thead>
            <tbody id="gf-gastos-tbody">
              ${rowsHtml}
            </tbody>
          </table>
        </div>
        <div class="pt-2 w-full max-w-md">
          <label class="block text-xs uppercase tracking-wider text-red-900/80 font-medium mb-1.5">Horas del mes</label>
          <input type="number" id="gf-horas" step="0.01" min="0" placeholder="Ej: 160" value="${(typeof initialHoras !== 'undefined' && initialHoras !== null && initialHoras !== '') ? String(initialHoras) : ''}" class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30">
        </div>
        <div id="gf-resultados" class="pt-4 mt-4 border-t-2 border-red-100 space-y-3 hidden">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 text-sm">
            <span class="text-gray-600">Total gastos fijos:</span>
            <span id="gf-total-productivo" class="font-medium"></span>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-1 text-sm">
            <span class="text-gray-600">Horas:</span>
            <span id="gf-horas-display" class="font-medium"></span>
          </div>
          <div class="pt-4 pb-2 border-t-2 border-gray-200">
            <p class="text-xs uppercase tracking-wider text-gray-600 mb-1">Gastos fijos por hora ($/h)</p>
            <p id="gf-por-hora-resultado" class="text-2xl font-medium text-red-600"></p>
          </div>
        </div>
        <div id="gf-error" class="hidden text-sm text-red-600 pt-2"></div>
        <div class="pt-4 mt-4 border-t border-gray-200">
          <button type="button" id="gf-imprimir" class="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 uppercase tracking-wider transition-colors">
            Imprimir
          </button>
        </div>
      </div>
    </div>
  `;
}

function setupPrecioVentaHandlers() {
  const precioCompraInput = document.getElementById('calc-pv-precio-compra');
  const conImpuestoCheck = document.getElementById('calc-pv-con-impuesto');
  const ivaSelect = document.getElementById('calc-pv-iva');
  const ivaContainer = document.getElementById('calc-pv-iva-container');
  const cantidadInput = document.getElementById('calc-pv-cantidad');
  const porcentajeInput = document.getElementById('calc-pv-porcentaje');
  const costoUnitarioEl = document.getElementById('calc-pv-costo-unitario');
  const gananciaEl = document.getElementById('calc-pv-ganancia');
  const precioEl = document.getElementById('calc-pv-precio');

  const formatCur = (n) => `$${Number(n).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  conImpuestoCheck?.addEventListener('change', () => {
    const checked = conImpuestoCheck.checked;
    if (ivaContainer) ivaContainer.classList.toggle('hidden', !checked);
    calcular();
    save();
  });

  const calcular = () => {
    const precioCompra = parseFloat(precioCompraInput?.value) || 0;
    const cantidad = parseFloat(cantidadInput?.value) || 1;
    const pct = parseFloat(porcentajeInput?.value) || 25;

    let importeNeto = precioCompra;
    if (conImpuestoCheck?.checked && precioCompra > 0) {
      const iva = parseFloat(ivaSelect?.value) || 22;
      importeNeto = precioCompra / (1 + iva / 100);
    }

    if (importeNeto <= 0 || cantidad <= 0 || pct < 0 || pct >= 100) {
      if (costoUnitarioEl) costoUnitarioEl.textContent = '—';
      if (gananciaEl) gananciaEl.textContent = '—';
      if (precioEl) precioEl.textContent = '—';
      return;
    }

    // Fórmula: PV = Costo Total / (1 - % Margen de Utilidad)
    const costoUnitario = importeNeto / cantidad;
    const precioVenta = costoUnitario / (1 - pct / 100);
    const ganancia = precioVenta - costoUnitario;

    if (costoUnitarioEl) costoUnitarioEl.textContent = formatCur(costoUnitario);
    if (gananciaEl) gananciaEl.textContent = formatCur(ganancia);
    if (precioEl) precioEl.textContent = formatCur(Math.round(precioVenta));
  };

  const save = () => {
    saveToStorage(LS_KEY_PV, {
      precioCompra: precioCompraInput?.value ?? '',
      conImpuesto: conImpuestoCheck?.checked ?? false,
      iva: ivaSelect?.value ?? '22',
      cantidad: cantidadInput?.value ?? '',
      porcentaje: porcentajeInput?.value ?? ''
    });
  };

  precioCompraInput?.addEventListener('input', () => { calcular(); save(); });
  cantidadInput?.addEventListener('input', () => { calcular(); save(); });
  porcentajeInput?.addEventListener('input', () => { calcular(); save(); });
  ivaSelect?.addEventListener('change', () => { calcular(); save(); });

  document.getElementById('calc-pv-limpiar')?.addEventListener('click', () => {
    saveToStorage(LS_KEY_PV, {});
    renderCalculatorContent('precio-venta');
    setupPrecioVentaHandlers();
  });

  document.getElementById('calc-pv-imprimir')?.addEventListener('click', () => {
    window.print();
  });

  calcular();
}

function setupManoObraHandlers() {
  const formatCur = (n) => `$${Number(n).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const recalc = () => {
    const rows = document.querySelectorAll('.mo-row');
    let totalCosto = 0;
    let totalHoras = 0;

    rows.forEach((row) => {
      const sb = parseFloat(row.querySelector('.mo-sueldo')?.value) || 0;
      const sdVal = parseFloat(row.querySelector('.mo-sueldo-declarado')?.value);
      const aportes = (sdVal !== undefined && !Number.isNaN(sdVal) && sdVal > 0)
        ? Math.round(sdVal * 0.15) : 0;
      const aguinaldo = Math.round(sb * 0.0833);
      const licencia = Math.round(sb * 0.0909);
      const costoReal = sb + aportes + aguinaldo + licencia;
      const hpd = parseFloat(row.querySelector('.mo-horas-dia')?.value) || 0;
      const dpm = parseFloat(row.querySelector('.mo-dias-mes')?.value) || 0;
      const horasMens = Math.round(hpd * dpm);

      const aportesEl = row.querySelector('.mo-aportes');
      const aguinaldoEl = row.querySelector('.mo-aguinaldo');
      const licenciaEl = row.querySelector('.mo-licencia');
      const costoEl = row.querySelector('.mo-costo-real');
      const horasEl = row.querySelector('.mo-horas-mens');
      if (aportesEl) aportesEl.textContent = formatCur(aportes);
      if (aguinaldoEl) aguinaldoEl.textContent = formatCur(aguinaldo);
      if (licenciaEl) licenciaEl.textContent = formatCur(licencia);
      if (costoEl) costoEl.textContent = formatCur(costoReal);
      if (horasEl) horasEl.textContent = String(horasMens);

      totalCosto += costoReal;
      totalHoras += horasMens;
    });

    const totalCostoEl = document.getElementById('mo-total-costo');
    const totalHorasEl = document.getElementById('mo-total-horas');
    const costoHoraEl = document.getElementById('mo-costo-hora');

    if (totalCostoEl) totalCostoEl.textContent = formatCur(totalCosto);
    if (totalHorasEl) totalHorasEl.textContent = totalHoras;
    if (costoHoraEl) costoHoraEl.textContent = totalHoras > 0 ? formatCur(Math.round(totalCosto / totalHoras)) : '—';

    const empleados = [];
    rows.forEach((row) => {
      const sd = row.querySelector('.mo-sueldo-declarado')?.value?.trim();
      empleados.push({
        id: row.dataset.rowId,
        nombre: row.querySelector('.mo-nombre')?.value?.trim() || '',
        sueldoBase: parseFloat(row.querySelector('.mo-sueldo')?.value) || 0,
        sueldoDeclarado: sd !== undefined && sd !== '' ? (parseFloat(sd) || null) : null,
        horasPorDia: parseFloat(row.querySelector('.mo-horas-dia')?.value) || 8,
        diasPorMes: parseFloat(row.querySelector('.mo-dias-mes')?.value) || 26
      });
    });
    saveToStorage(LS_KEY_MO, { empleados });
  };

  document.getElementById('mo-add-row')?.addEventListener('click', () => {
    const rows = document.querySelectorAll('.mo-row');
    const empleados = [];
    rows.forEach((row) => {
      const sd = row.querySelector('.mo-sueldo-declarado')?.value?.trim();
      empleados.push({
        id: row.dataset.rowId,
        nombre: row.querySelector('.mo-nombre')?.value?.trim() || '',
        sueldoBase: parseFloat(row.querySelector('.mo-sueldo')?.value) || 0,
        sueldoDeclarado: sd !== undefined && sd !== '' ? (parseFloat(sd) || null) : null,
        horasPorDia: parseFloat(row.querySelector('.mo-horas-dia')?.value) || 8,
        diasPorMes: parseFloat(row.querySelector('.mo-dias-mes')?.value) || 26
      });
    });
    const maxId = Math.max(0, ...empleados.map((e) => Number(e.id) || 0));
    moEmpleados = [...empleados, { id: maxId + 1, nombre: '', sueldoBase: 0, sueldoDeclarado: null, horasPorDia: 8, diasPorMes: 26 }];
    renderCalculatorContent('mano-obra', { skipLoad: true });
    setupManoObraHandlers();
  });

  document.getElementById('calc-mo-limpiar')?.addEventListener('click', () => {
    saveToStorage(LS_KEY_MO, {});
    moEmpleados = [{ id: 1, nombre: '', sueldoBase: 0, sueldoDeclarado: null, horasPorDia: 8, diasPorMes: 26 }];
    renderCalculatorContent('mano-obra', { skipLoad: true });
    setupManoObraHandlers();
  });

  document.getElementById('calc-mo-imprimir')?.addEventListener('click', () => {
    const styleEl = document.createElement('style');
    styleEl.textContent = '@media print { @page { size: landscape; margin: 0; } }';
    document.head.appendChild(styleEl);
    const cleanup = () => {
      styleEl.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  });

  if (!moListenersSetup) {
    moListenersSetup = true;
    const content = document.getElementById('calculadoras-content');
    content?.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.mo-remove');
      if (!removeBtn) return;
      const rowId = removeBtn.dataset.rowId;
      const rows = document.querySelectorAll('.mo-row');
      if (rows.length <= 1) return;
      const empleados = [];
      rows.forEach((row) => {
        const sd = row.querySelector('.mo-sueldo-declarado')?.value?.trim();
        empleados.push({
          id: row.dataset.rowId,
          nombre: row.querySelector('.mo-nombre')?.value?.trim() || '',
          sueldoBase: parseFloat(row.querySelector('.mo-sueldo')?.value) || 0,
          sueldoDeclarado: sd !== undefined && sd !== '' ? (parseFloat(sd) || null) : null,
          horasPorDia: parseFloat(row.querySelector('.mo-horas-dia')?.value) || 8,
          diasPorMes: parseFloat(row.querySelector('.mo-dias-mes')?.value) || 26
        });
      });
      moEmpleados = empleados.filter((e) => String(e.id) !== String(rowId));
      renderCalculatorContent('mano-obra', { skipLoad: true });
      setupManoObraHandlers();
    });
    content?.addEventListener('input', (e) => {
      if (e.target.matches('.mo-nombre, .mo-sueldo, .mo-sueldo-declarado, .mo-horas-dia, .mo-dias-mes')) recalc();
    });
    content?.addEventListener('change', (e) => {
      if (e.target.matches('.mo-nombre, .mo-sueldo, .mo-sueldo-declarado, .mo-horas-dia, .mo-dias-mes')) recalc();
    });
  }

  recalc();
}

function setupGFPorHoraHandlers(opts) {
  const addBtn = document.getElementById('gf-add-row');
  const horasInput = document.getElementById('gf-horas');
  const resultadosDiv = document.getElementById('gf-resultados');
  const errorDiv = document.getElementById('gf-error');
  const preservedHoras = opts && opts.preservedHoras != null ? String(opts.preservedHoras) : '';

  const recalc = () => {
    const rows = document.querySelectorAll('.gf-row');
    const gastos = [];
    for (const row of rows) {
      const id = row.dataset.rowId;
      const nombre = row.querySelector('.gf-nombre')?.value?.trim() || '';
      const monto = parseFloat(row.querySelector('.gf-monto')?.value) || 0;
      let pct = parseFloat(row.querySelector('.gf-pct')?.value);
      if (isNaN(pct) || pct < 0) pct = 100;
      if (pct > 100) pct = 100;
      gastos.push({ id, nombre, monto, porcentaje: pct });
    }

    const detalle = gastos.map((g) => {
      const montoProductivo = g.monto * (g.porcentaje / 100);
      return { ...g, montoProductivo };
    });

    const formatCur = (n) => `$${Number(n).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    document.querySelectorAll('.gf-row').forEach((row, i) => {
      const cell = row.querySelector('.gf-subtotal-cell');
      if (cell && detalle[i]) cell.textContent = formatCur(detalle[i].montoProductivo);
    });

    const currentHorasInput = document.getElementById('gf-horas');
    const horasVal = parseFloat(currentHorasInput?.value) || 0;
    const horasToSave = (currentHorasInput?.value != null && currentHorasInput.value !== '') ? String(currentHorasInput.value) : '';

    if (horasVal <= 0) {
      if (resultadosDiv) resultadosDiv.classList.add('hidden');
      if (errorDiv) {
        errorDiv.textContent = 'Ingrese horas mayores a 0';
        errorDiv.classList.remove('hidden');
      }
      saveToStorage(LS_KEY_GF, { gastos, horas: horasToSave });
      return;
    }

    if (errorDiv) errorDiv.classList.add('hidden');

    const totalProductivo = detalle.reduce((s, g) => s + g.montoProductivo, 0);
    const gfPorHora = totalProductivo / horasVal;

    const totalEl = document.getElementById('gf-total-productivo');
    const horasEl = document.getElementById('gf-horas-display');
    const resultadoEl = document.getElementById('gf-por-hora-resultado');

    if (totalEl) totalEl.textContent = formatCur(totalProductivo);
    if (horasEl) horasEl.textContent = `${horasVal.toFixed(2)} h`;
    if (resultadoEl) resultadoEl.textContent = `$${Math.round(gfPorHora).toLocaleString('es-CL')}`;

    if (resultadosDiv) resultadosDiv.classList.remove('hidden');

    saveToStorage(LS_KEY_GF, { gastos, horas: horasToSave });
  };

  addBtn?.addEventListener('click', () => {
    const preservedHoras = document.getElementById('gf-horas')?.value ?? '';
    const rows = document.querySelectorAll('.gf-row');
    const gastos = [];
    for (const row of rows) {
      const id = row.dataset.rowId;
      const nombre = row.querySelector('.gf-nombre')?.value?.trim() || '';
      const monto = parseFloat(row.querySelector('.gf-monto')?.value) || 0;
      let pct = parseFloat(row.querySelector('.gf-pct')?.value);
      if (isNaN(pct) || pct < 0) pct = 100;
      if (pct > 100) pct = 100;
      gastos.push({ id, nombre, monto, porcentaje: pct });
    }
    const maxId = Math.max(0, ...gastos.map((g) => Number(g.id) || 0));
    gfPorHoraGastos = [...gastos, { id: maxId + 1, nombre: '', monto: 0, porcentaje: 100 }];
    renderCalculatorContent('gf-por-hora', { skipLoad: true, preservedHoras });
  });

  document.getElementById('gf-limpiar')?.addEventListener('click', () => {
    saveToStorage(LS_KEY_GF, {});
    gfPorHoraGastos = [{ id: 1, nombre: '', monto: 0, porcentaje: 100 }];
    renderCalculatorContent('gf-por-hora', { skipLoad: true });
    setupGFPorHoraHandlers();
  });

  document.getElementById('gf-imprimir')?.addEventListener('click', () => {
    window.print();
  });

  if (!gfPorHoraListenersSetup) {
    gfPorHoraListenersSetup = true;
    const content = document.getElementById('calculadoras-content');
    content?.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.gf-remove');
      if (!removeBtn) return;
      const rowId = removeBtn.dataset.rowId;
      const rows = document.querySelectorAll('.gf-row');
      if (rows.length <= 1) return;
      const gastos = [];
      for (const row of rows) {
        const id = row.dataset.rowId;
        const nombre = row.querySelector('.gf-nombre')?.value?.trim() || '';
        const monto = parseFloat(row.querySelector('.gf-monto')?.value) || 0;
        let pct = parseFloat(row.querySelector('.gf-pct')?.value);
        if (isNaN(pct) || pct < 0) pct = 100;
        if (pct > 100) pct = 100;
        gastos.push({ id, nombre, monto, porcentaje: pct });
      }
      const preservedHoras = document.getElementById('gf-horas')?.value ?? '';
      gfPorHoraGastos = gastos.filter((g) => String(g.id) !== String(rowId));
      renderCalculatorContent('gf-por-hora', { skipLoad: true, preservedHoras });
    });
    const onTableOrHorasChange = (e) => {
      if (e.target.matches('.gf-nombre, .gf-monto, .gf-pct') || e.target.id === 'gf-horas') recalc();
    };
    content?.addEventListener('input', onTableOrHorasChange);
    content?.addEventListener('change', onTableOrHorasChange);
  }

  horasInput?.addEventListener('input', recalc);
  horasInput?.addEventListener('change', recalc);
  horasInput?.addEventListener('blur', recalc);

  if (horasInput && preservedHoras) horasInput.value = preservedHoras;
  recalc();
}

/**
 * Render apps grid
 */
function renderApps() {
  logger.debug('Rendering apps grid', { appCount: APPS.length });
  const appsGrid = document.getElementById('apps-grid');
  
  if (!appsGrid) {
    logger.warn('Apps grid element not found');
    return;
  }
  
  const escapeHtml = window.escapeHtml || ((text) => {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  });
  
  appsGrid.innerHTML = APPS.map(app => `
    <a href="${escapeHtml(app.url)}" 
       class="block border border-gray-200 p-3 sm:p-4 md:p-6 hover:border-red-600 transition-colors">
      <div class="flex items-center gap-3 sm:gap-4 mb-3">
        <div class="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span class="text-2xl sm:text-3xl">${app.icon || "📱"}</span>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-lg sm:text-xl font-light tracking-tight mb-1">${escapeHtml(app.name)}</h3>
          <p class="text-sm sm:text-base text-gray-600">Acceder a ${escapeHtml(app.name)}</p>
        </div>
      </div>
    </a>
  `).join('');
  
  logger.debug('Apps grid rendered successfully');
}
