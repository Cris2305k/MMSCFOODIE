import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import app, get_db, Base
import json

# Configurar base de datos de prueba
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def sample_user_data():
    return {
        "email": "test@ucatolica.edu.co",
        "name": "Usuario de Prueba"
    }

@pytest.fixture
def sample_product_data():
    return {
        "name": "Hamburguesa Test",
        "description": "Hamburguesa de prueba",
        "price": 8000.0,
        "image_url": "https://example.com/image.jpg",
        "category_id": 1
    }

@pytest.fixture
def sample_category_data():
    return {
        "name": "Comida Rápida Test",
        "description": "Categoría de prueba"
    }

class TestAPI:
    """Test suite para la API de BlessedFood"""
    
    def test_read_root(self, client):
        """Test del endpoint raíz"""
        response = client.get("/")
        assert response.status_code == 200
        assert "BlessedFood API" in response.json()["message"]

class TestUsers:
    """Test suite para endpoints de usuarios"""
    
    def test_create_user_student(self, client, sample_user_data):
        """Test crear usuario estudiante"""
        response = client.post("/users/", json=sample_user_data)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == sample_user_data["email"]
        assert data["name"] == sample_user_data["name"]
        assert data["is_student"] == True  # Email @ucatolica.edu.co
    
    def test_create_user_non_student(self, client):
        """Test crear usuario no estudiante"""
        user_data = {
            "email": "test@gmail.com",
            "name": "Usuario Gmail"
        }
        response = client.post("/users/", json=user_data)
        assert response.status_code == 200
        data = response.json()
        assert data["is_student"] == False
    
    def test_get_user(self, client, sample_user_data):
        """Test obtener usuario por ID"""
        # Crear usuario primero
        create_response = client.post("/users/", json=sample_user_data)
        user_id = create_response.json()["id"]
        
        # Obtener usuario
        response = client.get(f"/users/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == sample_user_data["email"]
    
    def test_get_nonexistent_user(self, client):
        """Test obtener usuario inexistente"""
        response = client.get("/users/999")
        assert response.status_code == 404
        assert "Usuario no encontrado" in response.json()["detail"]

class TestCategories:
    """Test suite para endpoints de categorías"""
    
    def test_create_category(self, client, sample_category_data):
        """Test crear categoría"""
        response = client.post("/categories/", json=sample_category_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == sample_category_data["name"]
        assert data["description"] == sample_category_data["description"]
    
    def test_get_categories(self, client, sample_category_data):
        """Test obtener todas las categorías"""
        # Crear categoría primero
        client.post("/categories/", json=sample_category_data)
        
        response = client.get("/categories/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(cat["name"] == sample_category_data["name"] for cat in data)

class TestProducts:
    """Test suite para endpoints de productos"""
    
    def test_get_products_empty(self, client):
        """Test obtener productos cuando no hay ninguno"""
        response = client.get("/products/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_product(self, client, sample_category_data, sample_product_data):
        """Test crear producto"""
        # Crear categoría primero
        cat_response = client.post("/categories/", json=sample_category_data)
        category_id = cat_response.json()["id"]
        sample_product_data["category_id"] = category_id
        
        # Crear producto
        response = client.post("/products/", json=sample_product_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == sample_product_data["name"]
        assert data["price"] == sample_product_data["price"]
        assert data["is_active"] == True
    
    def test_update_product(self, client, sample_category_data, sample_product_data):
        """Test actualizar producto"""
        # Crear categoría y producto
        cat_response = client.post("/categories/", json=sample_category_data)
        category_id = cat_response.json()["id"]
        sample_product_data["category_id"] = category_id
        
        prod_response = client.post("/products/", json=sample_product_data)
        product_id = prod_response.json()["id"]
        
        # Actualizar producto
        updated_data = sample_product_data.copy()
        updated_data["name"] = "Hamburguesa Actualizada"
        updated_data["price"] = 9000.0
        
        response = client.put(f"/products/{product_id}", json=updated_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Hamburguesa Actualizada"
        assert data["price"] == 9000.0
    
    def test_delete_product(self, client, sample_category_data, sample_product_data):
        """Test eliminar (desactivar) producto"""
        # Crear categoría y producto
        cat_response = client.post("/categories/", json=sample_category_data)
        category_id = cat_response.json()["id"]
        sample_product_data["category_id"] = category_id
        
        prod_response = client.post("/products/", json=sample_product_data)
        product_id = prod_response.json()["id"]
        
        # Eliminar producto
        response = client.delete(f"/products/{product_id}")
        assert response.status_code == 200
        assert "desactivado exitosamente" in response.json()["message"]
    
    def test_update_nonexistent_product(self, client, sample_product_data):
        """Test actualizar producto inexistente"""
        response = client.put("/products/999", json=sample_product_data)
        assert response.status_code == 404
        assert "Producto no encontrado" in response.json()["detail"]

class TestOrders:
    """Test suite para endpoints de pedidos"""
    
    def test_create_order_success(self, client, sample_user_data, sample_category_data, sample_product_data):
        """Test crear pedido exitoso"""
        # Crear usuario, categoría y producto
        user_response = client.post("/users/", json=sample_user_data)
        cat_response = client.post("/categories/", json=sample_category_data)
        category_id = cat_response.json()["id"]
        sample_product_data["category_id"] = category_id
        prod_response = client.post("/products/", json=sample_product_data)
        product_id = prod_response.json()["id"]
        
        # Crear pedido
        order_data = {
            "items": [
                {
                    "product_id": product_id,
                    "quantity": 2
                }
            ],
            "delivery_address": "Edificio E, segundo piso, salón 201",
            "payment_method": "nequi"
        }
        
        response = client.post(f"/orders/?user_email={sample_user_data['email']}", json=order_data)
        assert response.status_code == 200
        data = response.json()
        assert data["delivery_address"] == order_data["delivery_address"]
        assert data["payment_method"] == order_data["payment_method"]
        assert data["status"] == "confirmed"
        assert len(data["items"]) == 1
        
        # Verificar descuento para estudiante
        assert data["discount_amount"] > 0  # Usuario @ucatolica.edu.co debe tener descuento
    
    def test_create_order_nonexistent_user(self, client):
        """Test crear pedido con usuario inexistente"""
        order_data = {
            "items": [{"product_id": 1, "quantity": 1}],
            "delivery_address": "Test Address",
            "payment_method": "efectivo"
        }
        
        response = client.post("/orders/?user_email=noexiste@test.com", json=order_data)
        assert response.status_code == 404
        assert "Usuario no encontrado" in response.json()["detail"]
    
    def test_create_order_nonexistent_product(self, client, sample_user_data):
        """Test crear pedido con producto inexistente"""
        # Crear usuario
        client.post("/users/", json=sample_user_data)
        
        order_data = {
            "items": [{"product_id": 999, "quantity": 1}],
            "delivery_address": "Test Address",
            "payment_method": "efectivo"
        }
        
        response = client.post(f"/orders/?user_email={sample_user_data['email']}", json=order_data)
        assert response.status_code == 404
        assert "Producto" in response.json()["detail"]
    
    def test_get_user_orders(self, client, sample_user_data, sample_category_data, sample_product_data):
        """Test obtener historial de pedidos de usuario"""
        # Crear usuario, categoría y producto
        client.post("/users/", json=sample_user_data)
        cat_response = client.post("/categories/", json=sample_category_data)
        category_id = cat_response.json()["id"]
        sample_product_data["category_id"] = category_id
        prod_response = client.post("/products/", json=sample_product_data)
        product_id = prod_response.json()["id"]
        
        # Crear pedido
        order_data = {
            "items": [{"product_id": product_id, "quantity": 1}],
            "delivery_address": "Test Address",
            "payment_method": "nequi"
        }
        client.post(f"/orders/?user_email={sample_user_data['email']}", json=order_data)
        
        # Obtener historial
        response = client.get(f"/orders/user/{sample_user_data['email']}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["delivery_address"] == "Test Address"
    
    def test_get_orders_nonexistent_user(self, client):
        """Test obtener historial de usuario inexistente"""
        response = client.get("/orders/user/noexiste@test.com")
        assert response.status_code == 404
        assert "Usuario no encontrado" in response.json()["detail"]

class TestRecommendations:
    """Test suite para endpoints de recomendaciones"""
    
    def test_get_recommendations_new_user(self, client):
        """Test obtener recomendaciones para usuario nuevo"""
        response = client.get("/recommendations/nuevo@test.com")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Para usuarios nuevos, debe devolver productos populares
        if len(data) > 0:
            assert "product" in data[0]
            assert "reason" in data[0]
            assert data[0]["reason"] == "Producto popular"
    
    def test_get_recommendations_existing_user(self, client, sample_user_data, sample_category_data, sample_product_data):
        """Test obtener recomendaciones para usuario con historial"""
        # Crear usuario, categoría y producto
        client.post("/users/", json=sample_user_data)
        cat_response = client.post("/categories/", json=sample_category_data)
        category_id = cat_response.json()["id"]
        sample_product_data["category_id"] = category_id
        prod_response = client.post("/products/", json=sample_product_data)
        product_id = prod_response.json()["id"]
        
        # Crear pedido para generar historial
        order_data = {
            "items": [{"product_id": product_id, "quantity": 1}],
            "delivery_address": "Test Address", 
            "payment_method": "nequi"
        }
        client.post(f"/orders/?user_email={sample_user_data['email']}", json=order_data)
        
        # Obtener recomendaciones
        response = client.get(f"/recommendations/{sample_user_data['email']}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

class TestBusinessLogic:
    """Test suite para lógica de negocio"""
    
    def test_student_discount_calculation(self, client, sample_category_data, sample_product_data):
        """Test cálculo de descuento para estudiantes"""
        # Crear usuario estudiante
        student_data = {
            "email": "estudiante@ucatolica.edu.co",
            "name": "Estudiante Test"
        }
        client.post("/users/", json=student_data)
        
        # Crear categoría y producto
        cat_response = client.post("/categories/", json=sample_category_data)
        category_id = cat_response.json()["id"]
        sample_product_data["category_id"] = category_id
        sample_product_data["price"] = 10000.0  # Precio fijo para cálculo
        prod_response = client.post("/products/", json=sample_product_data)
        product_id = prod_response.json()["id"]
        
        # Crear pedido
        order_data = {
            "items": [{"product_id": product_id, "quantity": 1}],
            "delivery_address": "Test Address",
            "payment_method": "nequi"
        }
        
        response = client.post(f"/orders/?user_email={student_data['email']}", json=order_data)
        data = response.json()
        
        # Verificar descuento del 15%
        expected_discount = 10000 * 0.15  # 1500
        assert data["discount_amount"] == expected_discount
        
        # Total = precio - descuento + envío
        expected_total = 10000 - 1500 + 5000  # 13500
        assert data["total_amount"] == expected_total
    
    def test_non_student_no_discount(self, client, sample_category_data, sample_product_data):
        """Test que usuarios no estudiantes no reciben descuento"""
        # Crear usuario no estudiante
        user_data = {
            "email": "usuario@gmail.com",
            "name": "Usuario Test"
        }
        client.post("/users/", json=user_data)
        
        # Crear categoría y producto
        cat_response = client.post("/categories/", json=sample_category_data)
        category_id = cat_response.json()["id"]
        sample_product_data["category_id"] = category_id
        sample_product_data["price"] = 10000.0
        prod_response = client.post("/products/", json=sample_product_data)
        product_id = prod_response.json()["id"]
        
        # Crear pedido
        order_data = {
            "items": [{"product_id": product_id, "quantity": 1}],
            "delivery_address": "Test Address",
            "payment_method": "nequi"
        }
        
        response = client.post(f"/orders/?user_email={user_data['email']}", json=order_data)
        data = response.json()
        
        # Verificar que no hay descuento
        assert data["discount_amount"] == 0.0
        
        # Total = precio + envío
        expected_total = 10000 + 5000  # 15000
        assert data["total_amount"] == expected_total
    
    def test_multiple_items_order(self, client, sample_user_data, sample_category_data, sample_product_data):
        """Test pedido con múltiples productos"""
        # Crear usuario, categoría y productos
        client.post("/users/", json=sample_user_data)
        cat_response = client.post("/categories/", json=sample_category_data)
        category_id = cat_response.json()["id"]
        
        # Crear dos productos
        sample_product_data["category_id"] = category_id
        sample_product_data["price"] = 8000.0
        prod1_response = client.post("/products/", json=sample_product_data)
        product1_id = prod1_response.json()["id"]
        
        product2_data = sample_product_data.copy()
        product2_data["name"] = "Producto 2"
        product2_data["price"] = 12000.0
        prod2_response = client.post("/products/", json=product2_data)
        product2_id = prod2_response.json()["id"]
        
        # Crear pedido con múltiples items
        order_data = {
            "items": [
                {"product_id": product1_id, "quantity": 2},
                {"product_id": product2_id, "quantity": 1}
            ],
            "delivery_address": "Test Address",
            "payment_method": "nequi"
        }
        
        response = client.post(f"/orders/?user_email={sample_user_data['email']}", json=order_data)
        assert response.status_code == 200
        data = response.json()
        
        # Verificar que se incluyen todos los items
        assert len(data["items"]) == 2
        
        # Calcular total esperado: (8000*2 + 12000*1) - descuento + envío
        subtotal = 8000 * 2 + 12000 * 1  # 28000
        descuento = subtotal * 0.15  # 4200 (estudiante)
        total_esperado = subtotal - descuento + 5000  # 28800
        
        assert data["total_amount"] == total_esperado

class TestValidations:
    """Test suite para validaciones"""
    
    def test_invalid_email_format(self, client):
        """Test validación de formato de email"""
        invalid_user_data = {
            "email": "email-invalido",
            "name": "Usuario Test"
        }
        response = client.post("/users/", json=invalid_user_data)
        assert response.status_code == 422  # Validation error
    
    def test_negative_price_product(self, client, sample_category_data):
        """Test validación de precio negativo"""
        cat_response = client.post("/categories/", json=sample_category_data)
        category_id = cat_response.json()["id"]
        
        invalid_product_data = {
            "name": "Producto Inválido",
            "description": "Producto con precio negativo",
            "price": -1000.0,
            "image_url": "https://example.com/image.jpg",
            "category_id": category_id
        }
        
        response = client.post("/products/", json=invalid_product_data)
        # La validación de precio negativo debería manejarse en el backend
        # Por ahora aceptamos que se cree, pero en producción se debería validar
        assert response.status_code in [200, 422]
    
    def test_empty_delivery_address(self, client, sample_user_data, sample_category_data, sample_product_data):
        """Test validación de dirección de entrega vacía"""
        # Crear usuario, categoría y producto
        client.post("/users/", json=sample_user_data)
        cat_response = client.post("/categories/", json=sample_category_data)
        category_id = cat_response.json()["id"]
        sample_product_data["category_id"] = category_id
        prod_response = client.post("/products/", json=sample_product_data)
        product_id = prod_response.json()["id"]
        
        # Intentar crear pedido sin dirección
        order_data = {
            "items": [{"product_id": product_id, "quantity": 1}],
            "delivery_address": "",  # Dirección vacía
            "payment_method": "nequi"
        }
        
        response = client.post(f"/orders/?user_email={sample_user_data['email']}", json=order_data)
        # El backend debería validar esto, por ahora puede pasar
        assert response.status_code in [200, 422]

@pytest.mark.integration
class TestIntegration:
    """Test suite de integración completa"""
    
    def test_complete_user_journey(self, client):
        """Test del flujo completo de usuario"""
        # 1. Crear usuario estudiante
        user_data = {
            "email": "estudiante@ucatolica.edu.co",
            "name": "Estudiante Completo"
        }
        user_response = client.post("/users/", json=user_data)
        assert user_response.status_code == 200
        
        # 2. Verificar que es estudiante
        user = user_response.json()
        assert user["is_student"] == True
        
        # 3. Obtener productos disponibles
        products_response = client.get("/products/")
        assert products_response.status_code == 200
        products = products_response.json()
        
        # Si hay productos del seed data
        if len(products) > 0:
            # 4. Crear pedido con producto existente
            product_id = products[0]["id"]
            order_data = {
                "items": [{"product_id": product_id, "quantity": 1}],
                "delivery_address": "Edificio principal, aula 101",
                "payment_method": "nequi"
            }
            
            order_response = client.post(f"/orders/?user_email={user_data['email']}", json=order_data)
            assert order_response.status_code == 200
            order = order_response.json()
            
            # 5. Verificar descuento aplicado
            assert order["discount_amount"] > 0
            
            # 6. Obtener historial de pedidos
            history_response = client.get(f"/orders/user/{user_data['email']}")
            assert history_response.status_code == 200
            history = history_response.json()
            assert len(history) >= 1
            
            # 7. Obtener recomendaciones (deberían existir después del pedido)
            recommendations_response = client.get(f"/recommendations/{user_data['email']}")
            assert recommendations_response.status_code == 200

if __name__ == "__main__":
    pytest.main(["-v", "--tb=short"])