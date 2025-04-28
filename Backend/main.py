from fastapi import FastAPI
from routers import productos

app = FastAPI()

# Incluyendo el router de productos
app.include_router(productos.router)
