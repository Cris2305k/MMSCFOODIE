
const firebaseConfig = {
  apiKey: "AIzaSyDk0RoiW5wyaNzsfKFlcyHH5vtpDYp7LeY",
  authDomain: "blessedfood-8aeba.firebaseapp.com",
  projectId: "blessedfood-8aeba",
  storageBucket: "blessedfood-8aeba.firebasestorage.app",
  messagingSenderId: "843865224329",
  appId: "1:843865224329:web:d46d3d7335bf2dfba40258"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Configuración de la API
const API_BASE_URL = 'http://localhost:8000';
let usuarioLogueado = false;
let usuarioActual = null;
let carrito = [];
let productos = [];
let recomendaciones = [];

// Funciones de utilidad
function mostrarCargando(show = true) {
    const loadingModal = document.getElementById('loading-modal');
    if (show) {
        loadingModal.classList.remove('none');
    } else {
        loadingModal.classList.add('none');
    }
}

function mostrarError(mensaje) {
    const errorModal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = mensaje;
    errorModal.classList.remove('none');
}

function mostrarExito(mensaje) {
    const successModal = document.getElementById('success-modal');
    const successMessage = document.getElementById('success-message');
    successMessage.textContent = mensaje;
    successModal.classList.remove('none');
}

function cerrarModales() {
    document.getElementById('error-modal').classList.add('none');
    document.getElementById('success-modal').classList.add('none');
}

// Event listeners para modales
document.getElementById('close-error').addEventListener('click', cerrarModales);
document.getElementById('close-success').addEventListener('click', cerrarModales);

// Funciones de API
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error en API:', error);
        throw error;
    }
}

async function crearOActualizarUsuario(email, nombre) {
    try {
        const userData = {
            email: email,
            name: nombre
        };
        
        const usuario = await fetchAPI('/users/', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        return usuario;
    } catch (error) {
        console.error('Error creando/actualizando usuario:', error);
        throw error;
    }
}

async function obtenerProductos() {
    try {
        const productosData = await fetchAPI('/products/');
        productos = productosData;
        return productosData;
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        mostrarError('Error al cargar los productos. Por favor, recarga la página.');
        return [];
    }
}

async function obtenerRecomendaciones(email) {
    try {
        const recomendacionesData = await fetchAPI(`/recommendations/${email}`);
        recomendaciones = recomendacionesData;
        return recomendacionesData;
    } catch (error) {
        console.error('Error obteniendo recomendaciones:', error);
        return [];
    }
}

async function crearPedido(pedidoData, userEmail) {
    try {
        const response = await fetchAPI(`/orders/?user_email=${userEmail}`, {
            method: 'POST',
            body: JSON.stringify(pedidoData)
        });
        return response;
    } catch (error) {
        console.error('Error creando pedido:', error);
        throw error;
    }
}

async function obtenerHistorialPedidos(email) {
    try {
        const historial = await fetchAPI(`/orders/user/${email}`);
        return historial;
    } catch (error) {
        console.error('Error obteniendo historial:', error);
        return [];
    }
}

// Funciones de autenticación
function loginWithProvider(provider) {
    auth.signInWithPopup(provider)
        .then(async (result) => {
            const user = result.user;
            const email = user.email;
            const domain = email.split("@")[1];
            const allowedDomains = ["ucatolica.edu.co", "gmail.com"];

            if (allowedDomains.includes(domain)) {
                try {
                    usuarioActual = await crearOActualizarUsuario(email, user.displayName);
                    usuarioLogueado = true;
                    
                    document.getElementById("user-status").textContent = `Bienvenido, ${user.displayName}`;
                    document.getElementById("google-login").style.display = "none";
                    document.getElementById("microsoft-login").style.display = "none";
                    document.getElementById("logout").style.display = "inline";
                    
                    // Mostrar descuento si es estudiante
                    if (usuarioActual.is_student) {
                        document.getElementById("student-status").classList.remove("none");
                    }
                    
                    // Cargar recomendaciones
                    await cargarRecomendaciones();
                    
                    // Mostrar historial
                    document.getElementById("order-history-section").classList.remove("none");
                    
                } catch (error) {
                    mostrarError("Error al procesar tu información de usuario");
                }
            } else {
                auth.signOut();
                mostrarError("Correo no autorizado. Solo se permiten correos de @ucatolica.edu.co y @gmail.com");
            }
        })
        .catch((error) => {
            console.error(error);
            mostrarError("Error en el login: " + error.message);
        });
}

// Event listeners para login
document.getElementById("google-login").addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    loginWithProvider(provider);
});

document.getElementById("microsoft-login").addEventListener('click', () => {
    const provider = new firebase.auth.OAuthProvider("microsoft.com");
    loginWithProvider(provider);
});

document.getElementById("logout").addEventListener('click', () => {
    auth.signOut().then(() => {
        usuarioLogueado = false;
        usuarioActual = null;
        
        document.getElementById("user-status").textContent = "No has iniciado sesión";
        document.getElementById("google-login").style.display = "inline";
        document.getElementById("microsoft-login").style.display = "inline";
        document.getElementById("logout").style.display = "none";
        document.getElementById("student-status").classList.add("none");
        document.getElementById("order-history-section").classList.add("none");
        document.getElementById("recommendations-section").classList.add("none");
        
        // Limpiar carrito
        carrito = [];
        actualizarCarrito();
    });
});

// Monitor de estado de autenticación
auth.onAuthStateChanged(async (user) => {
    if (user) {
        const email = user.email;
        const domain = email.split('@')[1];
        const allowedDomains = ["ucatolica.edu.co", "gmail.com"];
        
        if (allowedDomains.includes(domain)) {
            try {
                usuarioActual = await crearOActualizarUsuario(email, user.displayName);
                usuarioLogueado = true;
                
                document.getElementById("user-status").textContent = `Bienvenido, ${user.displayName}`;
                document.getElementById("google-login").style.display = "none";
                document.getElementById("microsoft-login").style.display = "none";
                document.getElementById("logout").style.display = "inline";
                
                if (usuarioActual.is_student) {
                    document.getElementById("student-status").classList.remove("none");
                }
                
                document.getElementById("order-history-section").classList.remove("none");
                await cargarRecomendaciones();
                
            } catch (error) {
                console.error("Error al cargar usuario:", error);
            }
        }
    } else {
        usuarioLogueado = false;
        usuarioActual = null;
        document.getElementById("user-status").textContent = "No has iniciado sesión";
        document.getElementById("google-login").style.display = "inline";
        document.getElementById("microsoft-login").style.display = "inline";
        document.getElementById("logout").style.display = "none";
        document.getElementById("student-status").classList.add("none");
        document.getElementById("order-history-section").classList.add("none");
        document.getElementById("recommendations-section").classList.add("none");
    }
});

// Funciones de productos
async function cargarProductos() {
    mostrarCargando(true);
    try {
        const productosData = await obtenerProductos();
        renderizarProductos(productosData);
    } catch (error) {
        mostrarError('Error al cargar los productos');
    } finally {
        mostrarCargando(false);
    }
}

function renderizarProductos(productosData) {
    const grid = document.getElementById('productos-grid');
    grid.innerHTML = '';
    
    productosData.forEach(producto => {
        const article = document.createElement('article');
        article.className = 'product-card';
        article.innerHTML = `
            <img src="${producto.image_url}" alt="${producto.name}" class="product-image">
            <div class="product-content">
                <h2 class="product-title">${producto.name}</h2>
                <p class="product-description">${producto.description}</p>
                <p class="product-price">$${producto.price.toLocaleString()} COP</p>
                <div class="product-actions">
                    <input type="number" id="cantidad-${producto.id}" class="quantity-input" min="1" value="1">
                    <button class="add-to-cart-btn" onclick="agregarProductoAlCarrito(${producto.id})">
                        <i class="fas fa-plus"></i> Agregar
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(article);
    });
}

async function cargarRecomendaciones() {
    if (!usuarioActual) return;
    
    try {
        const recomendacionesData = await obtenerRecomendaciones(usuarioActual.email);
        if (recomendacionesData.length > 0) {
            renderizarRecomendaciones(recomendacionesData);
            document.getElementById("recommendations-section").classList.remove("none");
        }
    } catch (error) {
        console.error('Error cargando recomendaciones:', error);
    }
}

function renderizarRecomendaciones(recomendacionesData) {
    const grid = document.getElementById('recommendations-grid');
    grid.innerHTML = '';
    
    recomendacionesData.forEach(recomendacion => {
        const producto = recomendacion.product;
        const div = document.createElement('div');
        div.className = 'recommendation-card';
        div.innerHTML = `
            <img src="${producto.image_url}" alt="${producto.name}" class="recommendation-image">
            <div class="recommendation-content">
                <h3>${producto.name}</h3>
                <p class="recommendation-reason">${recomendacion.reason}</p>
                <p class="recommendation-price">$${producto.price.toLocaleString()} COP</p>
                <button class="recommendation-btn" onclick="agregarProductoAlCarrito(${producto.id})">
                    <i class="fas fa-plus"></i> Agregar
                </button>
            </div>
        `;
        grid.appendChild(div);
    });
}

// Funciones del carrito
function agregarProductoAlCarrito(productoId) {
    if (!usuarioLogueado) {
        mostrarError("Debes iniciar sesión para agregar productos al carrito.");
        return;
    }

    const inputCantidad = document.getElementById(`cantidad-${productoId}`);
    const cantidad = inputCantidad ? parseInt(inputCantidad.value) : 1;

    if (isNaN(cantidad) || cantidad < 1) {
        mostrarError("Por favor ingresa una cantidad válida.");
        return;
    }

    const producto = productos.find(p => p.id === productoId);
    if (!producto) {
        mostrarError("Producto no encontrado.");
        return;
    }

    // Agregar la cantidad especificada al carrito
    for (let i = 0; i < cantidad; i++) {
        carrito.push({
            id: producto.id,
            nombre: producto.name,
            precio: producto.price
        });
    }

    // Resetear el input de cantidad
    if (inputCantidad) {
        inputCantidad.value = 1;
    }

    actualizarCarrito();
    mostrarExito(`${cantidad} ${producto.name}(s) agregado(s) al carrito!`);
}

function actualizarCarrito() {
    const contenedor = document.getElementById("productosAgregadosAlCarrito");
    const totalLabel = document.getElementById("total");
    const subtotalLabel = document.getElementById("subtotal");
    const descuentoLabel = document.getElementById("descuento");
    const titulo = document.getElementById("tituloDeCarrito");
    const cartCount = document.getElementById("cart-count");
    const discountSection = document.getElementById("discount-section");
    
    const envio = 5000;

    // Actualizar contador del carrito
    if (carrito.length > 0) {
        cartCount.textContent = carrito.length;
        cartCount.classList.remove("none");
    } else {
        cartCount.classList.add("none");
    }

    // Limpiar contenedor
    contenedor.innerHTML = "";
    let subtotal = 0;

    if (carrito.length === 0) {
        titulo.textContent = "Aún no has agregado productos al carrito";
        totalLabel.parentElement.classList.add("none");
        contenedor.classList.add("none");
        document.querySelector(".delivery-form").classList.add("none");
        document.querySelector(".checkout-btn").classList.add("none");
        document.getElementById("metodoPago").classList.add("none");
        return;
    }

    // Mostrar productos en el carrito
    carrito.forEach((item, index) => {
        const div = document.createElement("div");
        div.innerHTML = `
            <span>${item.nombre} - $${item.precio.toLocaleString()} COP</span>
            <button class="boton-eliminar" onclick="eliminarProductoDelCarrito(${index})">
                <i class="fas fa-trash"></i> Eliminar
            </button>
        `;
        contenedor.appendChild(div);
        subtotal += item.precio;
    });

    // Calcular descuento
    let descuento = 0;
    if (usuarioActual && usuarioActual.is_student) {
        descuento = Math.round(subtotal * 0.15);
        discountSection.classList.remove("none");
        descuentoLabel.textContent = `-$${descuento.toLocaleString()} COP`;
    } else {
        discountSection.classList.add("none");
    }

    // Actualizar títulos y mostrar elementos
    titulo.textContent = "Productos en tu carrito:";
    contenedor.classList.remove("none");
    totalLabel.parentElement.classList.remove("none");
    document.querySelector(".delivery-form").classList.remove("none");
    document.querySelector(".checkout-btn").classList.remove("none");
    document.getElementById("metodoPago").classList.remove("none");

    // Calcular y mostrar totales
    const total = subtotal - descuento + envio;
    subtotalLabel.textContent = `$${subtotal.toLocaleString()} COP`;
    totalLabel.innerHTML = `<span>Total:</span><span>$${total.toLocaleString()} COP</span>`;
}

function eliminarProductoDelCarrito(index) {
    if (index >= 0 && index < carrito.length) {
        const productoEliminado = carrito[index];
        carrito.splice(index, 1);
        actualizarCarrito();
        mostrarExito(`${productoEliminado.nombre} eliminado del carrito`);
    }
}

// Funciones del carrito (navegación)
function AbrirElCarrito() {
    const nav = document.getElementById("carrito");
    nav.style.display = "block";
    nav.style.right = "0";
}

function cerrarCarrito() {
    const nav = document.getElementById("carrito");
    nav.style.display = "none";
}

// Event listeners del carrito
document.getElementById("iconoDelCarrito").addEventListener('click', AbrirElCarrito);
document.getElementById("cerrar-carrito").addEventListener('click', cerrarCarrito);

// Función para realizar pedido
async function RealizarCompra() {
    if (!usuarioLogueado || !usuarioActual) {
        mostrarError("Debes iniciar sesión para realizar una compra.");
        return;
    }

    if (carrito.length === 0) {
        mostrarError("Tu carrito está vacío. Agrega algunos productos antes de realizar el pedido.");
        return;
    }

    const direccion = document.getElementById("direccion").value.trim();
    const metodoPago = document.getElementById("pago").value;
    const advertencia = document.getElementById("advertencia");

    // Validar dirección
    if (!direccion || direccion.length < 10) {
        advertencia.classList.remove("none");
        document.getElementById("direccion").focus();
        return;
    } else {
        advertencia.classList.add("none");
    }

    // Mostrar modal de procesamiento
    document.getElementById("procesando").classList.remove("none");

    try {
        // Preparar datos del pedido
        const itemsAgrupados = {};
        carrito.forEach(item => {
            if (itemsAgrupados[item.id]) {
                itemsAgrupados[item.id].quantity += 1;
            } else {
                itemsAgrupados[item.id] = {
                    product_id: item.id,
                    quantity: 1
                };
            }
        });

        const pedidoData = {
            items: Object.values(itemsAgrupados),
            delivery_address: direccion,
            payment_method: metodoPago
        };

        // Crear pedido en el backend
        const pedidoCreado = await crearPedido(pedidoData, usuarioActual.email);

        // NUEVA LÓGICA DE REDIRECCIÓN PARA NEQUI Y DAVIPLATA
        // Preparar datos simplificados para el pago
        const datosOrden = {
            orderId: `PEDIDO-${Date.now()}`, // ID simple
            total: pedidoCreado.total_amount,
            direccion: direccion,
            metodoPago: metodoPago,
            fecha: new Date().toISOString()
        };

        // Verificar método de pago
        if (metodoPago === 'nequi') {
            redireccionarANequi(datosOrden);
            return; // Salir de la función
            
        } else if (metodoPago === 'daviplata') {
            redireccionarADaviplata(datosOrden);
            return; // Salir de la función
        }

        // Si es efectivo, continúa con el flujo normal
        // Crear resumen del pedido
        const resumenProductos = pedidoCreado.items.map(item => 
            `- ${item.product_name} (x${item.quantity}): $${item.total.toLocaleString()} COP`
        ).join('\n');
        
        const metodoPagoTexto = metodoPago === 'nequi' ? '💜 Nequi' : 
                              metodoPago === 'daviplata' ? '🔴 Daviplata' : '💵 Efectivo';
        
        const resumenPedido = `
🍽️ PEDIDO CONFIRMADO - BLESSEDFOOD 🍽️

📋 PRODUCTOS:
${resumenProductos}

💰 RESUMEN:
Subtotal: $${(pedidoCreado.total_amount - 5000 + pedidoCreado.discount_amount).toLocaleString()} COP
${pedidoCreado.discount_amount > 0 ? `Descuento estudiante: -$${pedidoCreado.discount_amount.toLocaleString()} COP\n` : ''}Envío: $5.000 COP
TOTAL: $${pedidoCreado.total_amount.toLocaleString()} COP

📍 DIRECCIÓN DE ENTREGA:
${pedidoCreado.delivery_address}

💳 MÉTODO DE PAGO:
${metodoPagoTexto}

⏰ Tiempo estimado de entrega: 30-45 minutos

¡Gracias por elegir BLESSEDFOOD! 
Tu pedido será preparado con amor y entregado pronto.
        `;

        alert(resumenPedido);

        // Limpiar carrito y formulario
        carrito = [];
        document.getElementById("direccion").value = "";
        document.getElementById("pago").value = "nequi";
        actualizarCarrito();
        cerrarCarrito();

        // Recargar recomendaciones (se actualizaron con la compra)
        await cargarRecomendaciones();

        // Mensaje final
        setTimeout(() => {
            alert("📱 Recibirás una notificación cuando tu pedido esté en camino. ¡Que disfrutes tu comida!");
        }, 1000);

    } catch (error) {
        console.error('Error al crear pedido:', error);
        mostrarError('Error al procesar tu pedido. Por favor, inténtalo de nuevo.');
    } finally {
        document.getElementById("procesando").classList.add("none");
    }
}

// Event listener para finalizar pedido
document.getElementById("finalizar-pedido").addEventListener('click', RealizarCompra);

// Función para mostrar botón de confirmación después del pago
function mostrarConfirmacionPago(datosOrden) {
    // Cerrar el modal de procesando
    document.getElementById("procesando").classList.add("none");
    
    // Crear un div para confirmar el pago
    const confirmDiv = document.createElement('div');
    confirmDiv.id = 'confirmar-pago-div';
    confirmDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        max-width: 300px;
    `;
    
    confirmDiv.innerHTML = `
        <h3 style="margin-bottom: 10px;">¿Ya realizaste el pago?</h3>
        <p style="margin-bottom: 15px; color: #666;">Orden: ${datosOrden.orderId}</p>
        <button onclick="confirmarPagoRealizado()" style="
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            width: 100%;
            margin-bottom: 10px;
        ">✓ Ya pagué</button>
        <button onclick="cancelarPago()" style="
            background: #dc3545;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            width: 100%;
        ">✗ Cancelar</button>
    `;
    
    document.body.appendChild(confirmDiv);
}

// Función para confirmar que el pago fue realizado
function confirmarPagoRealizado() {
    const pedidoEnProceso = JSON.parse(localStorage.getItem('pedidoEnProceso'));
    
    if (pedidoEnProceso) {
        // Mostrar resumen del pedido
        const resumenPedido = `
🍽️ PEDIDO CONFIRMADO - BLESSEDFOOD 🍽️

📋 ID del Pedido: ${pedidoEnProceso.orderId}

💰 Total pagado: ${pedidoEnProceso.total.toLocaleString()} COP

📍 DIRECCIÓN DE ENTREGA:
${pedidoEnProceso.direccion}

💳 MÉTODO DE PAGO:
${pedidoEnProceso.metodoPago === 'nequi' ? '💜 Nequi' : '🔴 Daviplata'}

⏰ Tiempo estimado de entrega: 30-45 minutos

¡Gracias por tu compra! 
Tu pedido está siendo preparado.

📱 Recibirás una notificación cuando esté en camino.
        `;
        
        alert(resumenPedido);
        
        // Limpiar todo
        localStorage.removeItem('pedidoEnProceso');
        carrito = [];
        document.getElementById("direccion").value = "";
        document.getElementById("pago").value = "nequi";
        actualizarCarrito();
        cerrarCarrito();
        
        // Remover el div de confirmación
        const confirmDiv = document.getElementById('confirmar-pago-div');
        if (confirmDiv) {
            confirmDiv.remove();
        }
        
        // Recargar recomendaciones
        cargarRecomendaciones();
    }
}

// Función para cancelar el pago
function cancelarPago() {
    if (confirm('¿Estás seguro de cancelar el pago?')) {
        // Remover el div de confirmación
        const confirmDiv = document.getElementById('confirmar-pago-div');
        if (confirmDiv) {
            confirmDiv.remove();
        }
        
        // No limpiar el carrito para que el usuario pueda intentar de nuevo
        localStorage.removeItem('pedidoEnProceso');
        
        mostrarError('Pago cancelado. Puedes intentarlo nuevamente.');
    }
}

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', async function() {
    // Cargar preferencia de modo oscuro
    const darkModePreference = localStorage.getItem('dark-mode');
    if (darkModePreference === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('modoOscuroToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Cargar productos
    await cargarProductos();
});

// Agregar estilos CSS dinámicos
const style = document.createElement('style');
style.textContent = `
    @keyframes highlight {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
    
    .cart-count {
        position: absolute;
        top: -8px;
        right: -8px;
        background: var(--danger);
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: bold;
    }
    
    .recommendation-card {
        background: var(--white);
        border-radius: 15px;
        padding: 1rem;
        box-shadow: var(--shadow);
        transition: var(--transition);
        text-align: center;
    }
    
    .recommendation-card:hover {
        transform: translateY(-5px);
        box-shadow: var(--shadow-hover);
    }
    
    .recommendation-image {
        width: 100%;
        height: 120px;
        object-fit: cover;
        border-radius: 10px;
        margin-bottom: 0.5rem;
    }
    
    .recommendation-content h3 {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-dark);
        margin-bottom: 0.3rem;
    }
    
    .recommendation-reason {
        font-size: 0.9rem;
        color: var(--text-light);
        margin-bottom: 0.5rem;
        font-style: italic;
    }
    
    .recommendation-price {
        font-size: 1rem;
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: 0.8rem;
    }
    
    .recommendation-btn {
        background: linear-gradient(135deg, var(--accent-color) 0%, var(--secondary-color) 100%);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 25px;
        cursor: pointer;
        font-weight: 600;
        transition: var(--transition);
        font-size: 0.9rem;
    }
    
    .recommendation-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(255,140,66,0.3);
    }
    
    .recommendations-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
    }
    
    .recommendations-title {
        color: var(--text-dark);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1rem;
        text-align: center;
    }
    
    .student-discount {
        background: linear-gradient(135deg, var(--success) 0%, #20c997 100%);
        color: white;
        padding: 0.8rem;
        border-radius: 10px;
        margin-top: 1rem;
        font-weight: 600;
        text-align: center;
    }
    
    .history-toggle {
        background: linear-gradient(135deg, #6c757d 0%, #5a638a 100%);
        color: white;
        border: none;
        padding: 1rem 2rem;
        border-radius: 50px;
        cursor: pointer;
        font-size: 1.1rem;
        font-weight: 600;
        transition: var(--transition);
        box-shadow: 0 4px 15px rgba(108,117,125,0.3);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 2rem auto;
    }
    
    .history-toggle:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(108,117,125,0.4);
    }
    
    .order-item {
        background: var(--white);
        border-radius: 15px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        box-shadow: var(--shadow);
        border-left: 4px solid var(--primary-color);
    }
    
    .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid var(--light-gray);
    }
    
    .order-header h4 {
        color: var(--text-dark);
        font-size: 1.2rem;
        font-weight: 700;
        margin: 0;
    }
    
    .order-date {
        color: var(--text-light);
        font-size: 0.9rem;
        font-weight: 500;
    }
    
    .order-details p {
        margin: 0.5rem 0;
        color: var(--text-dark);
        line-height: 1.4;
    }
    
    .order-total {
        font-size: 1.1rem;
        color: var(--primary-color) !important;
        margin-top: 1rem !important;
    }
    
    .order-status {
        display: inline-block;
        padding: 0.3rem 0.8rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        margin-top: 0.5rem;
    }
    
    .status-confirmed {
        background: var(--success);
        color: white;
    }
    
    .status-pending {
        background: var(--secondary-color);
        color: white;
    }
    
    .status-delivered {
        background: #28a745;
        color: white;
    }
    
    .no-orders {
        text-align: center;
        color: var(--text-light);
        font-style: italic;
        padding: 2rem;
    }
    
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    }
    
    .modal-content {
        background: var(--white);
        padding: 2rem;
        border-radius: 20px;
        max-width: 500px;
        width: 90%;
        text-align: center;
        box-shadow: var(--shadow-hover);
    }
    
    .modal-content h3 {
        color: var(--danger);
        margin-bottom: 1rem;
        font-size: 1.5rem;
    }
    
    .modal-content.success h3 {
        color: var(--success);
    }
    
    .modal-content p {
        color: var(--text-dark);
        margin-bottom: 1.5rem;
        line-height: 1.5;
    }
    
    .modal-btn {
        background: var(--danger);
        color: white;
        border: none;
        padding: 0.8rem 2rem;
        border-radius: 25px;
        cursor: pointer;
        font-weight: 600;
        transition: var(--transition);
    }
    
    .modal-btn.success-btn {
        background: var(--success);
    }
    
    .modal-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    
    .loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        color: white;
        font-size: 1.2rem;
        font-weight: 600;
    }
    
    .loading-spinner i {
        font-size: 3rem;
        animation: spin 1s linear infinite;
    }
    
    .subtotal-cost, .discount-cost {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-dark);
    }
    
    .discount-cost {
        color: var(--success);
    }
    
    /* Dark mode para nuevos elementos */
    .dark-mode .recommendation-card,
    .dark-mode .order-item,
    .dark-mode .modal-content {
        background: var(--darker-bg);
        color: var(--white);
    }
    
    .dark-mode .recommendation-content h3,
    .dark-mode .order-header h4,
    .dark-mode .order-details p,
    .dark-mode .modal-content p,
    .dark-mode .recommendations-title {
        color: var(--white);
    }
    
    .dark-mode .recommendation-reason,
    .dark-mode .order-date {
        color: #ccc;
    }
    
    /* Responsive para recomendaciones */
    @media (max-width: 768px) {
        .recommendations-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 0.8rem;
        }
        
        .recommendation-card {
            padding: 0.8rem;
        }
        
        .recommendation-image {
            height: 100px;
        }
        
        .order-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
    }
`
async function toggleHistorial() {
    const content = document.getElementById("order-history-content");
    const isVisible = !content.classList.contains("none");
    
    if (isVisible) {
        content.classList.add("none");
    } else {
        content.classList.remove("none");
        await cargarHistorial();
    }
}

async function cargarHistorial() {
    if (!usuarioActual) return;
    
    try {
        const historial = await obtenerHistorialPedidos(usuarioActual.email);
        renderizarHistorial(historial);
    } catch (error) {
        console.error('Error cargando historial:', error);
        mostrarError('Error al cargar el historial de pedidos');
    }
}

function renderizarHistorial(historial) {
    const container = document.getElementById("orders-list");
    container.innerHTML = '';
    
    if (historial.length === 0) {
        container.innerHTML = '<p class="no-orders">No tienes pedidos anteriores</p>';
        return;
    }
    
    historial.forEach(pedido => {
        const div = document.createElement('div');
        div.className = 'order-item';
        
        const fecha = new Date(pedido.created_at).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const productos = pedido.items.map(item => 
            `${item.product_name} (x${item.quantity})`
        ).join(', ');
        
        div.innerHTML = `
            <div class="order-header">
                <h4>Pedido #${pedido.id}</h4>
                <span class="order-date">${fecha}</span>
            </div>
            <div class="order-details">
                <p><strong>Productos:</strong> ${productos}</p>
                <p><strong>Dirección:</strong> ${pedido.delivery_address}</p>
                <p><strong>Método de pago:</strong> ${pedido.payment_method}</p>
                ${pedido.discount_amount > 0 ? `<p><strong>Descuento aplicado:</strong> $${pedido.discount_amount.toLocaleString()} COP</p>` : ''}
                <p class="order-total"><strong>Total: $${pedido.total_amount.toLocaleString()} COP</strong></p>
                <span class="order-status status-${pedido.status}">${pedido.status}</span>
            </div>
        `;
        
        container.appendChild(div);
    });
}

// Event listener para historial
document.getElementById("historial-toggle").addEventListener('click', toggleHistorial);

// Función para mostrar/ocultar información del equipo
function toggleQuienesSomos() {
    const info = document.getElementById("info-integrantes");
    const isVisible = !info.classList.contains("none");
    
    if (isVisible) {
        info.classList.add("none");
    } else {
        info.classList.remove("none");
    }
}

// Event listener para "quiénes somos"
document.getElementById("about-toggle").addEventListener('click', toggleQuienesSomos);

// Función de búsqueda
function buscarProducto() {
    const input = document.getElementById('buscador');
    const filter = input.value.toLowerCase().trim();
    const productCards = document.querySelectorAll('.product-card');

    if (filter === '') {
        productCards.forEach(producto => {
            producto.style.display = "block";
        });
        return;
    }

    productCards.forEach(producto => {
        const nombre = producto.querySelector('.product-title').innerText.toLowerCase();
        const descripcion = producto.querySelector('.product-description').innerText.toLowerCase();
        const precio = producto.querySelector('.product-price').innerText.toLowerCase();
        
        if (nombre.includes(filter) || descripcion.includes(filter) || precio.includes(filter)) {
            producto.style.display = "block";
            producto.style.animation = "highlight 0.5s ease-in-out";
        } else {
            producto.style.display = "none";
        }
    });
}

// Event listener para búsqueda
document.getElementById('buscador').addEventListener('input', buscarProducto);

// Función para modo oscuro
function toggleModoOscuro() {
    const body = document.body;
    const isDarkMode = body.classList.contains('dark-mode');
    
    if (isDarkMode) {
        body.classList.remove('dark-mode');
        document.getElementById('modoOscuroToggle').innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('dark-mode', 'false');
    } else {
        body.classList.add('dark-mode');
        document.getElementById('modoOscuroToggle').innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('dark-mode', 'true');
    }
}

// Event listener para modo oscuro
document.getElementById('modoOscuroToggle').addEventListener('click', toggleModoOscuro);

// Cerrar carrito al hacer clic fuera
document.addEventListener('click', function(event) {
    const carrito = document.getElementById('carrito');
    const iconoCarrito = document.getElementById('iconoDelCarrito');
    
    if (carrito.style.display === 'block' && 
        !carrito.contains(event.target) && 
        !iconoCarrito.contains(event.target)) {
        cerrarCarrito();
    }
});

// Prevenir que el carrito se cierre al hacer clic dentro
document.getElementById('carrito').addEventListener('click', function(event) {
    event.stopPropagation();
});

// NUEVAS FUNCIONES PARA REDIRECCIÓN DE PAGOS

// Función para redireccionar a Nequi (página principal)
function redireccionarANequi(datosOrden) {
    // Guardar información del pedido
    localStorage.setItem('pedidoEnProceso', JSON.stringify(datosOrden));
    
    // Mostrar instrucciones al usuario
    const mensaje = `
📱 INSTRUCCIONES PARA PAGAR CON NEQUI:

1. Serás redirigido a la página de Nequi
2. Inicia sesión en tu cuenta
3. Envía el dinero a: 3001234567 
4. Monto a pagar: $${datosOrden.total.toLocaleString()} COP
5. En la descripción coloca: ${datosOrden.orderId}

Después de realizar el pago, regresa aquí y confirma tu pedido.
    `;
    
    alert(mensaje);
    
    // Abrir Nequi en una nueva pestaña
    window.open('https://www.nequi.com.co/', '_blank');
    
    // Mostrar botón de confirmación
    mostrarConfirmacionPago(datosOrden);
}

// Función para redireccionar a Daviplata (página principal)
function redireccionarADaviplata(datosOrden) {
    // Guardar información del pedido
    localStorage.setItem('pedidoEnProceso', JSON.stringify(datosOrden));
    
    // Mostrar instrucciones al usuario
    const mensaje = `
📱 INSTRUCCIONES PARA PAGAR CON DAVIPLATA:

1. Serás redirigido a la página de Daviplata
2. Inicia sesión en tu cuenta
3. Envía el dinero a: 3001234567 
4. Monto a pagar: $${datosOrden.total.toLocaleString()} COP
5. En la descripción coloca: ${datosOrden.orderId}

Después de realizar el pago, regresa aquí y confirma tu pedido.
    `;
    
    alert(mensaje);
    
    // Abrir Daviplata en una nueva pestaña
    window.open('https://www.daviplata.com/', '_blank');
    
    // Mostrar botón de confirmación
    mostrarConfirmacionPago(datosOrden);
}

