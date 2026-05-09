from sqlalchemy import (
    Column, Integer, String, Numeric, Date, Text,
    ForeignKey, UniqueConstraint, create_engine
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

# =========================================================
# 1. SEGMENTOS
# =========================================================

class Segment(Base):
    __tablename__ = 'segments'
    __table_args__ = {"schema": "superstore"}
    segment_id = Column(Integer, primary_key=True, autoincrement=True)
    segment_name = Column(String(100), nullable=False, unique=True)

    customers = relationship("Customer", back_populates="segment")


# =========================================================
# 2. CLIENTES
# =========================================================

class Customer(Base):
    __tablename__ = 'customers'
    __table_args__ = {"schema": "superstore"}
    customer_id = Column(String(30), primary_key=True)
    customer_name = Column(String(200), nullable=False)
    segment_id = Column(Integer, ForeignKey('superstore.segments.segment_id'), nullable=False)

    segment = relationship("Segment", back_populates="customers")
    orders = relationship("Order", back_populates="customer")


# =========================================================
# 3. MODOS DE ENVÍO
# =========================================================

class ShipMode(Base):
    __tablename__ = 'ship_modes'
    __table_args__ = {"schema": "superstore"}
    ship_mode_id = Column(Integer, primary_key=True, autoincrement=True)
    ship_mode_name = Column(String(100), nullable=False, unique=True)

    orders = relationship("Order", back_populates="ship_mode")


# =========================================================
# 4. UBICACIONES
# =========================================================

class Location(Base):
    __tablename__ = 'locations'
    __table_args__ = (
        UniqueConstraint('country', 'city', 'state', 'postal_code', 'region', name='uq_locations'),
        {"schema": "superstore"}
    )

    location_id = Column(Integer, primary_key=True, autoincrement=True)
    country = Column(String(100))
    city = Column(String(120))
    state = Column(String(120))
    postal_code = Column(String(20))
    region = Column(String(80))

    orders = relationship("Order", back_populates="location")


# =========================================================
# 5. CATEGORÍAS Y SUBCATEGORÍAS
# =========================================================

class Category(Base):
    __tablename__ = 'categories'
    __table_args__ = {"schema": "superstore"}
    category_id = Column(Integer, primary_key=True, autoincrement=True)
    category_name = Column(String(120), nullable=False, unique=True)

    subcategories = relationship("Subcategory", back_populates="category")


class Subcategory(Base):
    __tablename__ = 'subcategories'
    __table_args__ = (
        UniqueConstraint('subcategory_name', 'category_id', name='uq_subcategories'),
        {"schema": "superstore"}
    )

    subcategory_id = Column(Integer, primary_key=True, autoincrement=True)
    subcategory_name = Column(String(120), nullable=False)
    category_id = Column(Integer, ForeignKey('superstore.categories.category_id'), nullable=False)

    category = relationship("Category", back_populates="subcategories")
    products = relationship("Product", back_populates="subcategory")


# =========================================================
# 6. PRODUCTOS
# =========================================================

class Product(Base):
    __tablename__ = 'products'
    __table_args__ = (
        UniqueConstraint('product_code', 'product_name', 'subcategory_id', name='uq_products'),
        {"schema": "superstore"}
    )

    product_pk = Column(Integer, primary_key=True, autoincrement=True)
    product_code = Column(String(60), nullable=False)
    product_name = Column(Text, nullable=False)
    subcategory_id = Column(Integer, ForeignKey('superstore.subcategories.subcategory_id'), nullable=False)

    subcategory = relationship("Subcategory", back_populates="products")
    order_details = relationship("OrderDetail", back_populates="product")


# =========================================================
# 7. ÓRDENES
# =========================================================

class Order(Base):
    __tablename__ = 'orders'
    __table_args__ = {"schema": "superstore"}   
    order_id = Column(String(50), primary_key=True)
    order_date = Column(Date, nullable=False)
    ship_date = Column(Date)
    customer_id = Column(String(30), ForeignKey('superstore.customers.customer_id'), nullable=False)
    ship_mode_id = Column(Integer, ForeignKey('superstore.ship_modes.ship_mode_id'), nullable=False)
    location_id = Column(Integer, ForeignKey('superstore.locations.location_id'), nullable=False)

    customer = relationship("Customer", back_populates="orders")
    ship_mode = relationship("ShipMode", back_populates="orders")
    location = relationship("Location", back_populates="orders")
    order_details = relationship("OrderDetail", back_populates="order")


# =========================================================
# 8. DETALLE DE ÓRDENES
# =========================================================

class OrderDetail(Base):
    __tablename__ = 'order_details'
    __table_args__ = {"schema": "superstore"}   
    order_detail_id = Column(Integer, primary_key=True, autoincrement=True)
    row_id = Column(Integer, nullable=False, unique=True)
    order_id = Column(String(50), ForeignKey('superstore.orders.order_id'), nullable=False)
    product_pk = Column(Integer, ForeignKey('superstore.products.product_pk'), nullable=False)
    sales = Column(Numeric(14, 4), nullable=False)
    quantity = Column(Integer, nullable=False)
    discount = Column(Numeric(8, 4), nullable=False)
    profit = Column(Numeric(14, 4), nullable=False)

    order = relationship("Order", back_populates="order_details")
    product = relationship("Product", back_populates="order_details")
