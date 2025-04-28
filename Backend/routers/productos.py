from fastapi import APIRouter
from schemas.producto_schema import ProductoCreate, ProductoOut
from models.producto import Producto

router = APIRouter()

# Simulando una "base de datos" en memoria para productos
productos_db = []

@router.post("/productos/", response_model=ProductoOut)
async def crear_producto(producto: ProductoCreate):
    nuevo_id = len(productos_db) + 1
    producto_guardado = Producto(id=nuevo_id, **producto.dict())
    productos_db.append(producto_guardado)
    return producto_guardado

@router.get("/productos/{producto_id}", response_model=ProductoOut)
async def obtener_producto(producto_id: int):
    producto = next((prod for prod in productos_db if prod.id == producto_id), None)
    if producto is None:
        return {"error": "Producto no encontrado"}
    return producto

@router.get("/productos/", response_model=list[ProductoOut])
async def listar_productos():
    return productos_db

@router.delete("/productos/{producto_id}", response_model=ProductoOut)
async def eliminar_producto(producto_id: int):
    producto = next((prod for prod in productos_db if prod.id == producto_id), None)
    if producto is None:
        return {"error": "Producto no encontrado"}
    productos_db.remove(producto)
    return producto

