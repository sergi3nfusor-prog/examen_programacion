// =========================================================
// INSTANCIAS GLOBALES
// =========================================================
let chartVentasCategoria  = null;
let chartGananciasRegion  = null;
let chartEvolucionMensual = null;
let chartTopProductos     = null;
let tabla                 = null;
let currentDetalle        = [];

// =========================================================
// CONFIGURACIÓN GLOBAL CHART.JS
// =========================================================
Chart.defaults.color       = '#bbbbbb';
Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
Chart.defaults.font.family = "'Inter', sans-serif";

const TOOLTIP_CFG = {
    backgroundColor: 'rgba(0,0,0,0.95)',
    titleColor: '#FF6600',
    bodyColor:  '#eeeeee',
    titleFont:  { family: "'Inter', sans-serif", size: 12, weight: '600' },
    bodyFont:   { size: 12 },
    borderColor: 'rgba(255,102,0,0.4)',
    borderWidth: 1,
    padding: 12,
    displayColors: false,
};
const ANIM_CFG   = { duration: 1400, easing: 'easeOutQuart' };
const SCALE_DARK = {
    grid:  { color: 'rgba(255,255,255,0.06)' },
    ticks: { color: '#aaaaaa', font: { size: 11, family: "'Inter', sans-serif" } },
};

// =========================================================
// 1. GRÁFICOS
// =========================================================
function renderGraficas(data) {
    renderVentasCategoria(data.ventasCategoria);
    renderGananciasRegion(data.gananciasRegion);
    renderEvolucionMensual(data.ventasMensuales);
    renderTopProductos(data.topProductos);
}

function renderVentasCategoria(data) {
    if (chartVentasCategoria) chartVentasCategoria.destroy();
    chartVentasCategoria = new Chart(document.getElementById('chartVentasCategoria'), {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.categoria),
            datasets: [{
                data: data.map(d => d.ventas),
                backgroundColor: ['#FF6600','#FF8533','#FFA366','#FFC299'],
                borderColor:     ['#111','#111','#111','#111'],
                borderWidth: 2, hoverOffset: 10,
            }],
        },
        options: {
            responsive: true,
            animation: { animateRotate: true, animateScale: true, duration: 1800 },
            plugins: {
                legend:  { position: 'right', labels: { color: '#cccccc', padding: 16, font: { size: 12 }, boxWidth: 12 } },
                tooltip: TOOLTIP_CFG,
            },
        },
    });
}

function renderGananciasRegion(data) {
    if (chartGananciasRegion) chartGananciasRegion.destroy();
    const ctx = document.getElementById('chartGananciasRegion').getContext('2d');
    const grad = ctx.createLinearGradient(0,0,0,280);
    grad.addColorStop(0,'rgba(255,102,0,0.8)');
    grad.addColorStop(1,'rgba(255,102,0,0.05)');
    chartGananciasRegion = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.region),
            datasets: [{ label:'Ganancias ($)', data: data.map(d => d.ganancias), backgroundColor: grad, borderColor:'rgba(255,102,0,0.4)', borderWidth:1, borderRadius:4 }],
        },
        options: {
            responsive: true,
            animation: { ...ANIM_CFG, delay: c => c.dataIndex * 80 },
            plugins: { legend: { display: false }, tooltip: TOOLTIP_CFG },
            scales:  { y: { ...SCALE_DARK, beginAtZero: true }, x: SCALE_DARK },
        },
    });
}

function renderEvolucionMensual(data) {
    if (chartEvolucionMensual) chartEvolucionMensual.destroy();
    const ctx = document.getElementById('chartEvolucionMensual').getContext('2d');
    const grad = ctx.createLinearGradient(0,0,0,280);
    grad.addColorStop(0,'rgba(255,102,0,0.3)');
    grad.addColorStop(1,'rgba(255,102,0,0.0)');
    chartEvolucionMensual = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => `${d.anio}-${String(d.mes).padStart(2,'0')}`),
            datasets: [{ label:'Ventas ($)', data: data.map(d => d.ventas), borderColor:'#FF6600', backgroundColor: grad, borderWidth:2, fill:true, tension:0.4, pointRadius:2, pointBackgroundColor:'#FF6600', pointHoverRadius:5 }],
        },
        options: {
            responsive: true,
            animation: ANIM_CFG,
            plugins: { legend: { display: false }, tooltip: TOOLTIP_CFG },
            scales:  { y: { ...SCALE_DARK, beginAtZero: true }, x: SCALE_DARK },
        },
    });
}

function renderTopProductos(data) {
    if (chartTopProductos) chartTopProductos.destroy();
    const ctx = document.getElementById('chartTopProductos').getContext('2d');
    const grad = ctx.createLinearGradient(0,0,400,0);
    grad.addColorStop(0,'rgba(255,102,0,0.08)');
    grad.addColorStop(1,'rgba(255,102,0,0.75)');
    chartTopProductos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.producto.length > 22 ? d.producto.substring(0,22)+'…' : d.producto),
            datasets: [{ label:'Ventas ($)', data: data.map(d => d.ventas), backgroundColor: grad, borderColor:'rgba(255,102,0,0.5)', borderWidth:1, borderRadius:3 }],
        },
        options: {
            indexAxis: 'y', responsive: true,
            animation: { ...ANIM_CFG, delay: c => c.dataIndex * 80 },
            plugins: { legend: { display: false }, tooltip: TOOLTIP_CFG },
            scales:  { x: { ...SCALE_DARK, beginAtZero: true }, y: SCALE_DARK },
        },
    });
}

// =========================================================
// 2. KPIs CON COUNTUP
// =========================================================
const countUps = {};
function animateValue(id, end, opts = {}) {
    const el = document.getElementById(id);
    if (!el) return;
    if (end == null || isNaN(end)) { el.textContent = '—'; return; }
    const CU = window.countUp ? window.countUp.CountUp : window.CountUp;
    if (!countUps[id]) {
        countUps[id] = new CU(id, end, { duration: 2.5, separator: ',', decimal: '.', ...opts });
    } else {
        countUps[id].update(end);
    }
    if (!countUps[id].error) countUps[id].start();
    else el.textContent = end;
}

function renderKpis(kpis) {
    animateValue('kpi-total-ventas',    kpis.totalVentas,        { decimalPlaces: 2, prefix: '$' });
    animateValue('kpi-total-ganancias', kpis.totalGanancias,     { decimalPlaces: 2, prefix: '$' });
    animateValue('kpi-total-pedidos',   kpis.totalPedidos);
    animateValue('kpi-margen',          kpis.margenRentabilidad, { decimalPlaces: 2, suffix: '%' });
}

// =========================================================
// 3. TABLA DATATABLES
// =========================================================
function renderTabla(data) {
    if (tabla) tabla.destroy();
    const tbody = document.querySelector('#tablaDatos tbody');
    tbody.innerHTML = '';
    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.order_id}</td>
            <td>${item.fecha}</td>
            <td>${item.cliente}</td>
            <td>${item.region}</td>
            <td>${item.categoria}</td>
            <td title="${item.producto}">${item.producto.substring(0,30)}${item.producto.length>30?'…':''}</td>
            <td>$${item.ventas.toFixed(2)}</td>
            <td class="${item.ganancia<0?'neg':'pos'}">$${item.ganancia.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
    tabla = new DataTable('#tablaDatos', {
        pageLength: 10,
        lengthMenu: [10,25,50,100],
        order: [[1,'desc']],
        language: {
            search:'Buscar:', lengthMenu:'Mostrar _MENU_ registros',
            info:'Mostrando _START_ a _END_ de _TOTAL_ registros',
            infoEmpty:'Sin registros', zeroRecords:'Sin resultados',
            paginate:{ first:'Primero', last:'Último', next:'→', previous:'←' },
        },
    });
}

// =========================================================
// 4. LOADING
// =========================================================
function showLoading() { document.getElementById('loadingOverlay').classList.add('active'); }
function hideLoading() { document.getElementById('loadingOverlay').classList.remove('active'); }

// =========================================================
// 5. FETCH API — CARGA DATOS
// =========================================================
function getParams() {
    return new URLSearchParams({
        year:     document.getElementById('sel-year').value,
        region:   document.getElementById('sel-region').value,
        category: document.getElementById('sel-category').value,
        segment:  document.getElementById('sel-segment').value,
    }).toString();
}

async function cargarDatos() {
    const params = getParams();
    showLoading();
    try {
        const [rK, rG, rD] = await Promise.all([
            fetch(`/api/kpis?${params}`),
            fetch(`/api/graficos?${params}`),
            fetch(`/api/detalle?${params}`),
        ]);
        if (!rK.ok || !rG.ok || !rD.ok) throw new Error('Server error');
        const [kpis, graficos, detalle] = await Promise.all([rK.json(), rG.json(), rD.json()]);
        currentDetalle = detalle;
        renderKpis(kpis);
        renderGraficas(graficos);
        renderTabla(detalle);
    } catch (err) {
        console.error('Error al cargar datos:', err);
    } finally {
        hideLoading();
    }
}

// =========================================================
// 6. EXPORTAR CSV
// =========================================================
document.getElementById('btnExportar').addEventListener('click', () => {
    if (!currentDetalle.length) { alert('No hay datos para exportar.'); return; }
    const headers = ['Order_ID','Fecha','Cliente','Region','Categoria','Producto','Ventas','Ganancia'];
    const rows = currentDetalle.map(d => [
        d.order_id, d.fecha,
        `"${d.cliente.replace(/"/g,'""')}"`, d.region, d.categoria,
        `"${d.producto.replace(/"/g,'""')}"`,
        d.ventas.toFixed(2), d.ganancia.toFixed(2),
    ]);
    const csv  = '\uFEFF' + [headers,...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href:url, download:'reporte_superstore.csv' });
    a.click();
    URL.revokeObjectURL(url);
});

// =========================================================
// 7. SIDEBAR TOGGLE + EVENTOS
// =========================================================
document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
});
document.getElementById('btnFiltrar').addEventListener('click', cargarDatos);
window.addEventListener('load', cargarDatos);
