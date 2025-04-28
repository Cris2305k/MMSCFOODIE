from pydantic import BaseModel

class ProductoBase(BaseModel):
    nombre: str
    descripcion: str
    precio: float
    stock: int

class ProductoCreate(ProductoBase):
    pass

class ProductoOut(ProductoBase):
    id: int

    class Config:
        orm_mode = True
