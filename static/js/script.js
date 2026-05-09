// =========================================================
// INSTANCIAS GLOBALES
// =========================================================

let chartVentasAnio    = null;
let chartVentasGenero  = null;
let chartVentasPlat    = null;
let chartVentasRegion  = null;
let tabla              = null;
let currentDetalle     = [];

// =========================================================
// 1. CÓDIGO DE GRÁFICOS (CHART.JS)
// =========================================================

Chart.defaults.color = '#8b95a5';
Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

const TOOLTIP_CONFIG = {
    backgroundColor: 'rgba(10, 14, 23, 0.95)',
    titleColor: '#00f0ff',
    bodyColor: '#e8edf5',
    titleFont: { family: "'Orbitron', sans-serif", size: 13 },
    bodyFont: { size: 13 },
    borderColor: 'rgba(0, 240, 255, 0.4)',
    borderWidth: 1,
    padding: 12,
    displayColors: false,
    callbacks: {
        label: function(context) {
            let value = context.parsed;
            if (typeof value === 'object' && value !== null) {
                value = value.y !== undefined ? value.y : value.x; 
            }
            let dataset = context.dataset.data;
            let total = dataset.reduce((a, b) => a + b, 0);
            let percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return ` Ventas: ${value.toFixed(2)} M  (${percentage}% del total)`;
        }
    }
};

const ANIM_CONFIG = { duration: 1500, easing: 'easeOutQuart' };
const DARK_SCALE = { grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }, ticks: { color: '#6b7688', font: { size: 11 } } };
const DARK_TITLE = { display: true, color: '#e8edf5', font: { family: "'Orbitron', sans-serif", size: 12, weight: 700 }, padding: { bottom: 8 } };

function renderGraficas(data) {
    renderChartVentasAnio(data);
    renderChartVentasGenero(data);
    renderChartVentasPlataforma(data);
    renderChartVentasRegion(data);
}

function renderChartVentasAnio(data) {
    const mapa = {};
    data.forEach(row => { if (row.anio != null) mapa[row.anio] = (mapa[row.anio] || 0) + row.totalVentas; });
    const labels = Object.keys(mapa).sort();
    const valores = labels.map(k => parseFloat(mapa[k].toFixed(2)));

    if (chartVentasAnio) chartVentasAnio.destroy();
    const ctx = document.getElementById("chartVentasAnio").getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, 320);
    grad.addColorStop(0, "rgba(0, 240, 255, 0.8)");
    grad.addColorStop(1, "rgba(0, 240, 255, 0.1)");

    chartVentasAnio = new Chart(ctx, {
        type: "bar",
        data: { labels, datasets: [{ label: "Ventas globales (M)", data: valores, backgroundColor: grad, borderColor: "rgba(0, 240, 255, 1)", borderWidth: 2, borderRadius: 6, hoverBackgroundColor: "rgba(0, 240, 255, 0.95)" }] },
        options: {
            responsive: true,
            animation: { ...ANIM_CONFIG, delay: (ctx) => ctx.dataIndex * 80 },
            plugins: { legend: { display: false }, title: { ...DARK_TITLE, text: "⚡ Ventas Globales por Año" }, tooltip: TOOLTIP_CONFIG },
            scales: { y: { ...DARK_SCALE, beginAtZero: true }, x: { ...DARK_SCALE } }
        }
    });
}

function renderChartVentasGenero(data) {
    const mapa = {};
    data.forEach(row => { if (row.genero) mapa[row.genero] = (mapa[row.genero] || 0) + row.totalVentas; });
    const sorted = Object.entries(mapa).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(e => e[0]);
    const valores = sorted.map(e => parseFloat(e[1].toFixed(2)));

    if (chartVentasGenero) chartVentasGenero.destroy();
    const ctx = document.getElementById("chartVentasGenero").getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 400, 0);
    grad.addColorStop(0, "rgba(180, 77, 255, 0.15)");
    grad.addColorStop(1, "rgba(180, 77, 255, 0.85)");

    chartVentasGenero = new Chart(ctx, {
        type: "bar",
        data: { labels, datasets: [{ label: "Ventas globales (M)", data: valores, backgroundColor: grad, borderColor: "rgba(180, 77, 255, 1)", borderWidth: 2, borderRadius: 6, hoverBackgroundColor: "rgba(180, 77, 255, 0.95)" }] },
        options: {
            indexAxis: "y", responsive: true,
            animation: { ...ANIM_CONFIG, delay: (ctx) => ctx.dataIndex * 100 },
            plugins: { legend: { display: false }, title: { ...DARK_TITLE, text: "🎭 Ventas Globales por Género" }, tooltip: TOOLTIP_CONFIG },
            scales: { x: { ...DARK_SCALE, beginAtZero: true }, y: { ...DARK_SCALE } }
        }
    });
}

function renderChartVentasPlataforma(data) {
    const mapa = {};
    data.forEach(row => { if (row.plataforma) mapa[row.plataforma] = (mapa[row.plataforma] || 0) + row.totalVentas; });
    const sorted = Object.entries(mapa).sort((a, b) => b[1] - a[1]).slice(0, 15);
    const labels = sorted.map(e => e[0]);
    const valores = sorted.map(e => parseFloat(e[1].toFixed(2)));

    if (chartVentasPlat) chartVentasPlat.destroy();
    const ctx = document.getElementById("chartVentasPlataforma").getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, 320);
    grad.addColorStop(0, "rgba(57, 255, 20, 0.8)");
    grad.addColorStop(1, "rgba(57, 255, 20, 0.1)");

    chartVentasPlat = new Chart(ctx, {
        type: "bar",
        data: { labels, datasets: [{ label: "Ventas globales (M)", data: valores, backgroundColor: grad, borderColor: "rgba(57, 255, 20, 1)", borderWidth: 2, borderRadius: 6, hoverBackgroundColor: "rgba(57, 255, 20, 0.95)" }] },
        options: {
            responsive: true,
            animation: { ...ANIM_CONFIG, delay: (ctx) => ctx.dataIndex * 60 },
            plugins: { legend: { display: false }, title: { ...DARK_TITLE, text: "🕹️ Top Plataformas por Ventas" }, tooltip: TOOLTIP_CONFIG },
            scales: { y: { ...DARK_SCALE, beginAtZero: true }, x: { ...DARK_SCALE } }
        }
    });
}

function renderChartVentasRegion(data) {
    let na = 0, eu = 0, jp = 0, otros = 0;
    data.forEach(row => { na += row.ventasNA || 0; eu += row.ventasEU || 0; jp += row.ventasJP || 0; otros += row.ventasOtros || 0; });
    if (chartVentasRegion) chartVentasRegion.destroy();
    chartVentasRegion = new Chart(document.getElementById("chartVentasRegion"), {
        type: "doughnut",
        data: {
            labels: ["🌎 Norteamérica", "🌍 Europa", "🌏 Japón", "🌐 Otros"],
            datasets: [{
                data: [parseFloat(na.toFixed(2)), parseFloat(eu.toFixed(2)), parseFloat(jp.toFixed(2)), parseFloat(otros.toFixed(2))],
                backgroundColor: ["rgba(0, 240, 255, 0.8)", "rgba(180, 77, 255, 0.8)", "rgba(57, 255, 20, 0.8)", "rgba(255, 107, 43, 0.8)"],
                borderColor: ["rgba(0, 240, 255, 1)", "rgba(180, 77, 255, 1)", "rgba(57, 255, 20, 1)", "rgba(255, 107, 43, 1)"],
                borderWidth: 2, hoverOffset: 18
            }]
        },
        options: {
            responsive: true,
            animation: { animateRotate: true, animateScale: true, duration: 2000, easing: 'easeOutBounce' },
            plugins: {
                legend: { position: "bottom", labels: { color: '#8b95a5', padding: 16, font: { size: 12 } } },
                title: { ...DARK_TITLE, text: "🌍 Distribución de Ventas por Región" },
                tooltip: TOOLTIP_CONFIG
            }
        }
    });
}

// =========================================================
// 2. CÓDIGO DE DISEÑO (UI, KPIs, TABLA, EVENTOS)
// =========================================================

function showLoading() {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.classList.add("active");
}

function hideLoading() {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.classList.remove("active");
}

let countUps = {};
function animateValue(elementId, endValue, options = {}) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (endValue == null || isNaN(endValue)) { el.textContent = endValue ?? "—"; return; }
    const CountUpClass = window.countUp ? window.countUp.CountUp : window.CountUp;
    if (!countUps[elementId]) {
        countUps[elementId] = new CountUpClass(elementId, endValue, { duration: 2.5, separator: ',', decimal: '.', ...options });
    } else {
        countUps[elementId].update(endValue);
    }
    if (!countUps[elementId].error) countUps[elementId].start();
    else { console.error(countUps[elementId].error); el.textContent = endValue; }
}

function renderKpis(kpis) {
    animateValue("kpi-total-juegos", kpis.totalJuegos);
    animateValue("kpi-total-ventas", kpis.totalVentasGlobales, { decimalPlaces: 2, suffix: ' M' });
    animateValue("kpi-promedio", kpis.promedio_ventas, { decimalPlaces: 2, suffix: ' M' });
    animateValue("kpi-max-venta", kpis.maxVenta, { decimalPlaces: 2, suffix: ' M' });

    document.getElementById("kpi-anio-top").textContent = kpis.anioMayorVenta ?? "—";
    document.getElementById("kpi-genero-top").textContent = kpis.generoMasVendido ?? "—";
    document.getElementById("kpi-plataforma-top").textContent = kpis.plataformaMasVendida ?? "—";
    document.getElementById("kpi-publisher-top").textContent = kpis.publisherTop ?? "—";
}

function renderTabla(data) {
    if (tabla) tabla.destroy();
    const tbody = document.querySelector("#tablaDatos tbody");
    tbody.innerHTML = "";
    data.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.rank ?? ""}</td>
            <td>${item.name ?? ""}</td>
            <td>${item.platform ?? ""}</td>
            <td>${item.year ?? ""}</td>
            <td>${item.genre ?? ""}</td>
            <td>${item.publisher ?? ""}</td>
            <td>${item.globalSales != null ? item.globalSales.toFixed(2) : "0.00"}</td>
            <td>${item.categoriaVentas ?? ""}</td>
            <td>${item.regionDominante ?? ""}</td>
        `;
        tbody.appendChild(tr);
    });

    tabla = new DataTable("#tablaDatos", {
        pageLength: 10,
        lengthMenu: [10, 25, 50, 100],
        language: {
            search: "Buscar:",
            lengthMenu: "Mostrar _MENU_ registros",
            info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
            infoEmpty: "Mostrando 0 a 0 de 0 registros",
            zeroRecords: "No se encontraron registros",
            paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" }
        }
    });
}

// Lógica de Obtención de Datos
// dividir las 3 y 
async function cargarDatos() {
    const anio = document.getElementById("anio").value;
    const genero = document.getElementById("genero").value;
    const plataforma = document.getElementById("plataforma").value;
    const publisher = document.getElementById("publisher").value;

    const params = `anio=${encodeURIComponent(anio)}&genero=${encodeURIComponent(genero)}&plataforma=${encodeURIComponent(plataforma)}&publisher=${encodeURIComponent(publisher)}`;

    showLoading();
    try {
        const [resKpis, resGraficos, resDetalle] = await Promise.all([
            fetch(`/api/kpis`), fetch(`/api/graficos?${params}`), fetch(`/api/detalle?${params}`)
        ]);

        const kpis = await resKpis.json();
        const graficos = await resGraficos.json();
        const detalle = await resDetalle.json();

        currentDetalle = detalle;
        renderKpis(kpis);
        renderGraficas(graficos);
        renderTabla(detalle);
    } catch (error) {
        console.error("Error al cargar datos:", error);
    } finally {
        hideLoading();
    }
}

// Eventos y Exportación
document.getElementById("btnExportar").addEventListener("click", () => {
    if (!currentDetalle || currentDetalle.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }
    const headers = ["Rank", "Nombre", "Plataforma", "Año", "Género", "Publisher", "Ventas_Globales_M", "Categoria", "Region"];
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n";
    currentDetalle.forEach(item => {
        let row = [
            item.rank || "",
            `"${(item.name || "").replace(/"/g, '""')}"`,
            item.platform || "",
            item.year || "",
            item.genre || "",
            `"${(item.publisher || "").replace(/"/g, '""')}"`,
            item.globalSales || 0,
            item.categoriaVentas || "",
            item.regionDominante || ""
        ];
        csvContent += row.join(",") + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_videojuegos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

document.getElementById("btnFiltrar").addEventListener("click", cargarDatos);
window.addEventListener("load", cargarDatos);
