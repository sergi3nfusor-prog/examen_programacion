from flask import Flask, render_template, request, jsonify
from sqlalchemy import func, extract
from functools import lru_cache
from config import Session
from models import (
    OrderDetail, Order, Customer, Segment,
    Location, Product, Subcategory, Category
)

app = Flask(__name__)


# =========================================================
# HELPER: QUERY BASE CON TODOS LOS JOINS NECESARIOS
# =========================================================

def _build_base(session):
    """Devuelve el query base con todos los joins ORM del modelo SuperStore."""
    return (
        session.query(OrderDetail)
        .join(Order,      OrderDetail.order_id    == Order.order_id)
        .join(Customer,   Order.customer_id        == Customer.customer_id)
        .join(Segment,    Customer.segment_id      == Segment.segment_id)
        .join(Location,   Order.location_id        == Location.location_id)
        .join(Product,    OrderDetail.product_pk   == Product.product_pk)
        .join(Subcategory, Product.subcategory_id  == Subcategory.subcategory_id)
        .join(Category,   Subcategory.category_id  == Category.category_id)
    )


def _apply_filters(q, year, region, category, segment):
    """Aplica filtros opcionales al query base mediante parámetros de la URL."""
    if year:     q = q.filter(extract('year', Order.order_date) == int(year))
    if region:   q = q.filter(Location.region        == region)
    if category: q = q.filter(Category.category_name == category)
    if segment:  q = q.filter(Segment.segment_name   == segment)
    return q


# =========================================================
# RUTA PRINCIPAL — carga los combos / filtros
# =========================================================

@lru_cache(maxsize=1)
def get_filtros():
    """Cachea los valores únicos de los selectores para no recalcularlos."""
    session = Session()
    anios     = (session.query(extract('year', Order.order_date).label('y'))
                 .distinct().order_by(extract('year', Order.order_date).desc()).all())
    regiones  = session.query(Location.region).distinct().order_by(Location.region).all()
    categorias= session.query(Category.category_name).distinct().order_by(Category.category_name).all()
    segmentos = session.query(Segment.segment_name).distinct().order_by(Segment.segment_name).all()
    session.close()
    return (
        [int(r[0]) for r in anios     if r[0]],
        [r[0]      for r in regiones  if r[0]],
        [r[0]      for r in categorias if r[0]],
        [r[0]      for r in segmentos  if r[0]],
    )


@app.route('/')
def index():
    anios, regiones, categorias, segmentos = get_filtros()
    return render_template(
        'index.html',
        anios=anios,
        regiones=regiones,
        categorias=categorias,
        segmentos=segmentos,
    )


# =========================================================
# API: KPIs EJECUTIVOS
# /api/kpis?year=&region=&category=&segment=
# =========================================================

@lru_cache(maxsize=128)
def get_kpis_data(year, region, category, segment):
    session = Session()
    q = _apply_filters(_build_base(session), year, region, category, segment)

    result = q.with_entities(
        func.sum(OrderDetail.sales).label('total_ventas'),
        func.sum(OrderDetail.profit).label('total_ganancias'),
        func.count(func.distinct(Order.order_id)).label('total_pedidos'),
    ).first()

    ventas    = float(result.total_ventas    or 0)
    ganancias = float(result.total_ganancias or 0)
    pedidos   = int(result.total_pedidos     or 0)
    margen    = round((ganancias / ventas * 100), 2) if ventas > 0 else 0.0

    session.close()
    return {
        "totalVentas":        ventas,
        "totalGanancias":     ganancias,
        "totalPedidos":       pedidos,
        "margenRentabilidad": margen,
    }


@app.route('/api/kpis')
def api_kpis():
    year     = request.args.get('year',     '')
    region   = request.args.get('region',   '')
    category = request.args.get('category', '')
    segment  = request.args.get('segment',  '')
    return jsonify(get_kpis_data(year, region, category, segment))


# =========================================================
# API: DATOS PARA GRÁFICOS
# /api/graficos?year=&region=&category=&segment=
# =========================================================

@lru_cache(maxsize=128)
def get_graficos_data(year, region, category, segment):
    session = Session()

    def bq():
        return _apply_filters(_build_base(session), year, region, category, segment)

    # — Gráfico 1: Ventas por categoría (Doughnut)
    vc = (bq()
          .with_entities(Category.category_name, func.sum(OrderDetail.sales).label('v'))
          .group_by(Category.category_name)
          .order_by(func.sum(OrderDetail.sales).desc())
          .all())

    # — Gráfico 2: Ganancias por región (Bar)
    gr = (bq()
          .with_entities(Location.region, func.sum(OrderDetail.profit).label('g'))
          .group_by(Location.region)
          .order_by(func.sum(OrderDetail.profit).desc())
          .all())

    # — Gráfico 3: Evolución mensual de ventas (Line)
    anio_col = extract('year',  Order.order_date).label('anio')
    mes_col  = extract('month', Order.order_date).label('mes')
    em = (bq()
          .with_entities(anio_col, mes_col, func.sum(OrderDetail.sales).label('v'))
          .group_by(anio_col, mes_col)
          .order_by(anio_col, mes_col)
          .all())

    # — Gráfico 4: Top 10 productos más vendidos (Horizontal Bar)
    tp = (bq()
          .with_entities(Product.product_name, func.sum(OrderDetail.sales).label('v'))
          .group_by(Product.product_name)
          .order_by(func.sum(OrderDetail.sales).desc())
          .limit(10)
          .all())

    session.close()
    return {
        "ventasCategoria": [{"categoria": r[0], "ventas":    float(r[1] or 0)} for r in vc],
        "gananciasRegion": [{"region":    r[0], "ganancias": float(r[1] or 0)} for r in gr],
        "ventasMensuales": [{"anio": int(r[0]), "mes": int(r[1]), "ventas": float(r[2] or 0)} for r in em],
        "topProductos":    [{"producto":  r[0], "ventas":    float(r[1] or 0)} for r in tp],
    }


@app.route('/api/graficos')
def api_graficos():
    year     = request.args.get('year',     '')
    region   = request.args.get('region',   '')
    category = request.args.get('category', '')
    segment  = request.args.get('segment',  '')
    return jsonify(get_graficos_data(year, region, category, segment))


# =========================================================
# API: TABLA DE DETALLE (DataTables)
# /api/detalle?year=&region=&category=&segment=
# =========================================================

@lru_cache(maxsize=128)
def get_detalle_data(year, region, category, segment):
    session = Session()
    q = _apply_filters(_build_base(session), year, region, category, segment)

    rows = (q
            .with_entities(
                Order.order_id,
                Order.order_date,
                Customer.customer_name,
                Location.region,
                Category.category_name,
                Product.product_name,
                OrderDetail.sales,
                OrderDetail.profit,
            )
            .order_by(Order.order_date.desc())
            .limit(2000)
            .all())

    data = [{
        "order_id":  r[0],
        "fecha":     r[1].strftime('%Y-%m-%d') if r[1] else '',
        "cliente":   r[2],
        "region":    r[3],
        "categoria": r[4],
        "producto":  r[5],
        "ventas":    float(r[6] or 0),
        "ganancia":  float(r[7] or 0),
    } for r in rows]

    session.close()
    return data


@app.route('/api/detalle')
def api_detalle():
    year     = request.args.get('year',     '')
    region   = request.args.get('region',   '')
    category = request.args.get('category', '')
    segment  = request.args.get('segment',  '')
    return jsonify(get_detalle_data(year, region, category, segment))


if __name__ == '__main__':
    app.run(debug=True)
