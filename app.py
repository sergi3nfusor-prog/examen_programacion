from flask import Flask, render_template, request, jsonify
from sqlalchemy import extract, func
from config import Session
from models import OrderDetail, Order, Customer, Segment, Location, Product, Subcategory, Category

app = Flask(__name__)

def apply_filters(query):
    anio = request.args.get('anio')
    region = request.args.get('region')
    categoria = request.args.get('categoria')
    segmento = request.args.get('segmento')
    
    if anio:
        query = query.filter(extract('year', Order.order_date) == int(anio))
    if region:
        query = query.filter(Location.region == region)
    if categoria:
        query = query.filter(Category.category_name == categoria)
    if segmento:
        query = query.filter(Segment.segment_name == segmento)
        
    return query

@app.route('/')
def index():
    session = Session()
    try:
        anios = session.query(extract('year', Order.order_date)).distinct().order_by(extract('year', Order.order_date).desc()).all()
        regiones = session.query(Location.region).distinct().order_by(Location.region).all()
        categorias = session.query(Category.category_name).distinct().order_by(Category.category_name).all()
        segmentos = session.query(Segment.segment_name).distinct().order_by(Segment.segment_name).all()
        
        return render_template(
            'index.html', 
            anios=[int(a[0]) for a in anios if a[0]], 
            regiones=[r[0] for r in regiones if r[0]], 
            categorias=[c[0] for c in categorias if c[0]], 
            segmentos=[s[0] for s in segmentos if s[0]]
        )
    finally:
        session.close()

@app.route('/api/kpis')
def get_kpis():
    session = Session()
    try:
        base_query = session.query(OrderDetail).join(Order).join(Customer).join(Segment).join(Location).join(Product).join(Subcategory).join(Category)
        base_query = apply_filters(base_query)
        
        result = base_query.with_entities(
            func.sum(OrderDetail.sales).label('total_ventas'),
            func.sum(OrderDetail.profit).label('total_ganancias'),
            func.count(func.distinct(Order.order_id)).label('total_pedidos')
        ).first()
        
        ventas = float(result.total_ventas or 0)
        ganancias = float(result.total_ganancias or 0)
        pedidos = int(result.total_pedidos or 0)
        margen = (ganancias / ventas * 100) if ventas > 0 else 0
        
        return jsonify({
            'totalVentas': ventas,
            'totalGanancias': ganancias,
            'totalPedidos': pedidos,
            'margenRentabilidad': margen
        })
    finally:
        session.close()

@app.route('/api/graficos')
def get_graficos():
    session = Session()
    try:
        base_query = session.query(OrderDetail).join(Order).join(Customer).join(Segment).join(Location).join(Product).join(Subcategory).join(Category)
        base_query = apply_filters(base_query)
        
        # 1. Ventas por categoría
        ventas_categoria = base_query.with_entities(
            Category.category_name, func.sum(OrderDetail.sales)
        ).group_by(Category.category_name).all()
        
        # 2. Ganancias por región
        ganancias_region = base_query.with_entities(
            Location.region, func.sum(OrderDetail.profit)
        ).group_by(Location.region).all()
        
        # 3. Evolución mensual de ventas
        ventas_mensuales = base_query.with_entities(
            extract('year', Order.order_date).label('anio'),
            extract('month', Order.order_date).label('mes'),
            func.sum(OrderDetail.sales)
        ).group_by('anio', 'mes').order_by('anio', 'mes').all()
        
        # 4. Top 10 productos más vendidos
        top_productos = base_query.with_entities(
            Product.product_name, func.sum(OrderDetail.sales)
        ).group_by(Product.product_name).order_by(func.sum(OrderDetail.sales).desc()).limit(10).all()
        
        return jsonify({
            'ventasCategoria': [{'categoria': row[0], 'ventas': float(row[1] or 0)} for row in ventas_categoria],
            'gananciasRegion': [{'region': row[0], 'ganancias': float(row[1] or 0)} for row in ganancias_region],
            'ventasMensuales': [{'anio': int(row[0]), 'mes': int(row[1]), 'ventas': float(row[2] or 0)} for row in ventas_mensuales],
            'topProductos': [{'producto': row[0], 'ventas': float(row[1] or 0)} for row in top_productos]
        })
    finally:
        session.close()

@app.route('/api/detalle')
def get_detalle():
    session = Session()
    try:
        base_query = session.query(OrderDetail, Order, Customer, Location, Category, Product).join(Order).join(Customer).join(Segment).join(Location).join(Product).join(Subcategory).join(Category)
        base_query = apply_filters(base_query)
        
        resultados = base_query.limit(1000).all()
        
        data = []
        for od, o, c, l, cat, p in resultados:
            data.append({
                'order_id': o.order_id,
                'fecha': o.order_date.strftime('%Y-%m-%d') if o.order_date else '',
                'cliente': c.customer_name,
                'region': l.region,
                'categoria': cat.category_name,
                'producto': p.product_name,
                'ventas': float(od.sales),
                'ganancia': float(od.profit)
            })
            
        return jsonify(data)
    finally:
        session.close()

if __name__ == '__main__':
    app.run(debug=True)
