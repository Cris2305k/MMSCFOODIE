# Blessedfood
## Para testing
instalar
pip install pytest==7.4.3 pytest-asyncio==0.21.1 httpx==0.25.2
Para correr el testing
pytest test_main.py -v
para mas detalles
pytest test_main.py -v --tb=short
## Despliegue
**Frontend**: https://cris2305k.github.io/MMSCFOODIE/
**Backend API**: https://mmscfoodie.onrender.com
**Documentación API**: https://mmscfoodie.onrender.com/docs
### Para Backend
pip install -r requirements.txt
uvicorn main:app --reload
## Funciona
Backend/API: https://mmscfoodie.onrender.com (FastAPI + PostgreSQL)
✅ Frontend: GitHub Pages (HTML + CSS + JavaScript)
✅ Autenticación: Firebase Auth (Google)
✅ Base de datos: PostgreSQL en Render
✅ Conexión: Frontend ↔ Backend funcionando perfectamente

## Características implementadas:

✅ Login con Google
✅ Descuento para estudiantes (15%)
✅ Carrito de compras
✅ Sistema de pedidos
✅ Recomendaciones personalizadas
✅ Historial de pedidos
✅ Modo oscuro
✅ Búsqueda de productos
✅ Integración de pagos (Nequi/Daviplata)

## stack tecnológico final:

Frontend: HTML5, CSS3, JavaScript ES6, Firebase Auth
Backend: Python, FastAPI, SQLAlchemy
Base de datos: PostgreSQL
Hosting: GitHub Pages + Render
SSL: Automático en ambos

## Futuras mejoras:

Panel de administración para ver usuarios registrados
Notificaciones push cuando el pedido esté listo
Geolocalización para delivery
Ratings y reviews de productos
### Tecnologías

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos con variables CSS y animaciones
- **JavaScript ES6+** - Lógica del cliente y manejo del DOM
- **Firebase Auth** - Autenticación segura
- **Font Awesome** - Iconografía
- **Google Fonts** - Tipografía (Poppins)

## Backend
- **Python 3.8+** - Lenguaje de programación
- **FastAPI** - Framework web moderno y rápido
- **SQLAlchemy** - ORM para base de datos
- **PostgreSQL** - Base de datos relacional
- **Pydantic** - Validación de datos
- **python-jose** - Manejo de JWT
- **Passlib** - Hashing de contraseñas

## DevOps & Deployment
- **Render** - Hosting del backend y base de datos
- **GitHub Pages** - Hosting del frontend
- **GitHub Actions** - CI/CD (opcional)
- **Git** - Control de versiones

## Testing
- **Pytest** - Framework de testing
- **HTTPx** - Cliente HTTP para tests
- **pytest-asyncio** - Testing asíncrono
###Desarrolladores
- Cristian Varon
- Miguel Velasco
- Sebastian Torres
- Miguel Torres
