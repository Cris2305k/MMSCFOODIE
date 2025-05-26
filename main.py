from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
import hashlib
from jose import jwt, JWTError
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv()

# Configuración de la base de datos para Render
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

SQLALCHEMY_DATABASE_URL = DATABASE_URL or "sqlite:///./blessedfood.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Configuración de seguridad
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "blessedfood_secret_key_2024_secure")
ALGORITHM = "HS256"

app = FastAPI(title="BlessedFood API", version="1.0.0")

# Configuración CORS - Permitir frontend desde GitHub Pages
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica dominios exactos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos de Base de Datos
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    is_student = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    orders = relationship("Order", back_populates="user")
    recommendations = relationship("UserRecommendation", back_populates="user")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text)
    
    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    price = Column(Float)
    image_url = Column(String)
    is_active = Column(Boolean, default=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    category = relationship("Category", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    total_amount = Column(Float)
    discount_amount = Column(Float, default=0.0)
    delivery_address = Column(Text)
    payment_method = Column(String)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    unit_price = Column(Float)
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

class UserRecommendation(Base):
    __tablename__ = "user_recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    score = Column(Float)
    reason = Column(String)
    
    user = relationship("User", back_populates="recommendations")

# Crear las tablas
Base.metadata.create_all(bind=engine)

# Esquemas Pydantic
class UserCreate(BaseModel):
    email: EmailStr
    name: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    is_student: bool
    
    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    image_url: str
    category_id: int

class ProductResponse(BaseModel):
    id: int
    name: str
    description: str
    price: float
    image_url: str
    is_active: bool
    category_id: int
    
    class Config:
        from_attributes = True

class CategoryCreate(BaseModel):
    name: str
    description: str

class CategoryResponse(BaseModel):
    id: int
    name: str
    description: str
    
    class Config:
        from_attributes = True

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    delivery_address: str
    payment_method: str

class OrderResponse(BaseModel):
    id: int
    total_amount: float
    discount_amount: float
    delivery_address: str
    payment_method: str
    status: str
    created_at: datetime
    items: List[dict]
    
    class Config:
        from_attributes = True

class RecommendationResponse(BaseModel):
    product: ProductResponse
    score: float
    reason: str
    
    class Config:
        from_attributes = True

# Dependencias
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def is_student_email(email: str) -> bool:
    return email.endswith("@ucatolica.edu.co")

# Funciones auxiliares
def calculate_student_discount(total: float) -> float:
    """Aplica 15% de descuento a estudiantes"""
    return total * 0.15

def generate_recommendations(db: Session, user_id: int) -> List[dict]:
    """Genera recomendaciones basadas en compras previas"""
    # Obtener productos más comprados por el usuario
    user_orders = db.query(Order).filter(Order.user_id == user_id).all()
    
    if not user_orders:
        # Para usuarios nuevos, recomendar productos populares
        popular_products = db.query(Product).filter(Product.is_active == True).limit(3).all()
        return [
            {
                "product": product,
                "score": 0.8,
                "reason": "Producto popular"
            }
            for product in popular_products
        ]
    
    # Productos ya comprados
    purchased_products = set()
    category_counts = {}
    
    for order in user_orders:
        for item in order.items:
            purchased_products.add(item.product_id)
            category_id = item.product.category_id
            category_counts[category_id] = category_counts.get(category_id, 0) + item.quantity
    
    # Recomendar productos de categorías favoritas que no haya comprado
    recommendations = []
    for category_id, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True):
        category_products = db.query(Product).filter(
            Product.category_id == category_id,
            Product.is_active == True,
            ~Product.id.in_(purchased_products)
        ).limit(2).all()
        
        for product in category_products:
            recommendations.append({
                "product": product,
                "score": min(0.9, 0.6 + (count * 0.1)),
                "reason": f"Basado en tus compras de {product.category.name}"
            })
    
    return recommendations[:5]

# Inicializar datos de ejemplo
def init_sample_data(db: Session):
    # Verificar si ya existen datos
    if db.query(Category).first():
        return
    
    # Crear categorías
    categories = [
        {"name": "Almuerzos", "description": "Comidas completas y balanceadas"},
        {"name": "Comidas Rápidas", "description": "Opciones rápidas y deliciosas"},
        {"name": "Bebidas", "description": "Bebidas refrescantes y naturales"},
        {"name": "Postres", "description": "Dulces tentaciones"},
        {"name": "Snacks", "description": "Bocadillos y aperitivos"}
    ]
    
    for cat_data in categories:
        category = Category(**cat_data)
        db.add(category)
    
    db.commit()
    
    # Crear productos
    products = [
        {"name": "Almuerzo Ejecutivo", "description": "Arroz, carne asada, papas fritas, ensalada fresca y jugo natural", "price": 12000, "image_url": "https://olaclick.com/wp-content/uploads/2023/02/menu-ejecutivo-con-pollo-compressed.jpg", "category_id": 1},
        {"name": "Hamburguesa de la Casa", "description": "Hamburguesa doble carne, queso cheddar, lechuga, tomate y papas", "price": 10000, "image_url": "https://images.unsplash.com/photo-1550547660-d9450f859349", "category_id": 2},
        {"name": "Perro Caliente", "description": "Salchicha premium, papas ripio, salsas y queso fundido", "price": 7000, "image_url": "https://www.revistamag.com/wp-content/uploads/2023/05/hot-dog-ternera-parrilla-snack-ketchup-ia-generativa.jpg", "category_id": 2},
        {"name": "Bebidas Refrescantes", "description": "Variedad de gaseosas frías y agua natural", "price": 2000, "image_url": "https://elmundoalinstante.com/wp-content/uploads/2023/01/bigstock-bottles-of-global-soft-drink-b-438811265_6_928x621.jpeg", "category_id": 3},
        {"name": "Brownie de Chocolate", "description": "Brownie casero húmedo y delicioso", "price": 5000, "image_url": "https://www.bettycrocker.lat/wp-content/uploads/2020/12/BClatam-recipe-brownies-clasicos-de-chocolate.png", "category_id": 4},
        {"name": "Empanada de Pollo", "description": "Empanada crujiente rellena de pollo y papa", "price": 3000, "image_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5EOGMmPnzdem-hno0swfu4Xa5dHLi9w_7Tw&s", "category_id": 5},
        {"name": "Arepa con Queso", "description": "Arepa tradicional con queso mozzarella fundido", "price": 4000, "image_url": "https://www.mycolombianrecipes.com/wp-content/uploads/2009/05/arepa-rellena-de-queso-045.jpg", "category_id": 5},
        {"name": "Limonada de Coco", "description": "Refrescante limonada natural con crema de coco", "price": 6000, "image_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQS1EjnIapdA1zZPCBLJ78UsOxZgEvvJed1hg&s", "category_id": 3}
    ]
    
    for prod_data in products:
        product = Product(**prod_data)
        db.add(product)
    
    db.commit()

# Endpoints de la API

@app.on_event("startup")
async def startup_event():
    db = SessionLocal()
    try:
        init_sample_data(db)
    except Exception as e:
        print(f"Error initializing data: {e}")
    finally:
        db.close()

@app.get("/")
async def root():
    return {"message": "BlessedFood API - ¡Bienvenido!", "status": "running"}

# Usuarios
@app.post("/users/", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Verificar si el usuario ya existe
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        return db_user
    
    # Crear nuevo usuario
    is_student = is_student_email(user.email)
    db_user = User(
        email=user.email,
        name=user.name,
        is_student=is_student
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

# Productos
@app.get("/products/", response_model=List[ProductResponse])
async def get_products(db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.is_active == True).all()
    return products

@app.post("/products/", response_model=ProductResponse)
async def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, product: ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    for key, value in product.dict().items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@app.delete("/products/{product_id}")
async def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    db_product.is_active = False
    db.commit()
    return {"message": "Producto desactivado exitosamente"}

# Categorías
@app.get("/categories/", response_model=List[CategoryResponse])
async def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    return categories

@app.post("/categories/", response_model=CategoryResponse)
async def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    db_category = Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

# Pedidos
@app.post("/orders/", response_model=OrderResponse)
async def create_order(order: OrderCreate, user_email: str, db: Session = Depends(get_db)):
    # Buscar o crear usuario
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Calcular total
    total_amount = 0
    order_items = []
    
    for item_data in order.items:
        product = db.query(Product).filter(Product.id == item_data.product_id).first()
        if not product or not product.is_active:
            raise HTTPException(status_code=404, detail=f"Producto {item_data.product_id} no encontrado")
        
        item_total = product.price * item_data.quantity
        total_amount += item_total
        
        order_items.append({
            "product_id": product.id,
            "quantity": item_data.quantity,
            "unit_price": product.price
        })
    
    # Aplicar descuento para estudiantes
    discount_amount = 0
    if user.is_student:
        discount_amount = calculate_student_discount(total_amount)
    
    # Agregar costo de envío
    shipping_cost = 5000
    final_total = total_amount - discount_amount + shipping_cost
    
    # Crear pedido
    db_order = Order(
        user_id=user.id,
        total_amount=final_total,
        discount_amount=discount_amount,
        delivery_address=order.delivery_address,
        payment_method=order.payment_method,
        status="confirmed"
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    # Crear items del pedido
    for item_data in order_items:
        db_item = OrderItem(
            order_id=db_order.id,
            **item_data
        )
        db.add(db_item)
    
    db.commit()
    
    # Actualizar recomendaciones del usuario
    recommendations = generate_recommendations(db, user.id)
    
    # Limpiar recomendaciones anteriores
    db.query(UserRecommendation).filter(UserRecommendation.user_id == user.id).delete()
    
    # Agregar nuevas recomendaciones
    for rec in recommendations:
        db_rec = UserRecommendation(
            user_id=user.id,
            product_id=rec["product"].id,
            score=rec["score"],
            reason=rec["reason"]
        )
        db.add(db_rec)
    
    db.commit()
    
    # Obtener el pedido completo con items
    db.refresh(db_order)
    order_response = OrderResponse(
        id=db_order.id,
        total_amount=db_order.total_amount,
        discount_amount=db_order.discount_amount,
        delivery_address=db_order.delivery_address,
        payment_method=db_order.payment_method,
        status=db_order.status,
        created_at=db_order.created_at,
        items=[
            {
                "product_name": item.product.name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total": item.quantity * item.unit_price
            }
            for item in db_order.items
        ]
    )
    
    return order_response

@app.get("/orders/user/{user_email}")
async def get_user_orders(user_email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    orders = db.query(Order).filter(Order.user_id == user.id).order_by(Order.created_at.desc()).all()
    
    return [
        {
            "id": order.id,
            "total_amount": order.total_amount,
            "discount_amount": order.discount_amount,
            "delivery_address": order.delivery_address,
            "payment_method": order.payment_method,
            "status": order.status,
            "created_at": order.created_at,
            "items": [
                {
                    "product_name": item.product.name,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "total": item.quantity * item.unit_price
                }
                for item in order.items
            ]
        }
        for order in orders
    ]

# Recomendaciones
@app.get("/recommendations/{user_email}")
async def get_user_recommendations(user_email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        # Para usuarios nuevos, devolver productos populares
        popular_products = db.query(Product).filter(Product.is_active == True).limit(3).all()
        return [
            {
                "product": product,
                "score": 0.8,
                "reason": "Producto popular"
            }
            for product in popular_products
        ]
    
    recommendations = db.query(UserRecommendation).filter(
        UserRecommendation.user_id == user.id
    ).join(Product).filter(Product.is_active == True).all()
    
    if not recommendations:
        return generate_recommendations(db, user.id)
    
    return [
        {
            "product": {
                "id": rec.product_id,
                "name": db.query(Product).filter(Product.id == rec.product_id).first().name,
                "description": db.query(Product).filter(Product.id == rec.product_id).first().description,
                "price": db.query(Product).filter(Product.id == rec.product_id).first().price,
                "image_url": db.query(Product).filter(Product.id == rec.product_id).first().image_url,
            },
            "score": rec.score,
            "reason": rec.reason
        }
        for rec in recommendations
    ]

# Configuración para Render
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)