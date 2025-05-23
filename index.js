
// Función de login
function loginWithProvider(provider) {
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            const email = user.email;
            const domain = email.split("@")[1];
            const allowedDomains = ["ucatolica.edu.co", "gmail.com"];

            if (allowedDomains.includes(domain)) {
                document.getElementById("user-status").textContent = `Bienvenido, ${user.displayName}`;
                document.getElementById("google-login").style.display = "none";
                document.getElementById("microsoft-login").style.display = "none";
                document.getElementById("logout").style.display = "inline";
            } else {
                auth.signOut();
                alert("Correo no autorizado. Solo se permiten correos de @ucatolica.edu.co y @gmail.com");
            }
        })
        .catch((error) => {
            console.error(error);
            alert("Error en el login: " + error.message);
        });
}

// Botones de login
document.getElementById("google-login").onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    loginWithProvider(provider);
};

document.getElementById("microsoft-login").onclick = () => {
    const provider = new firebase.auth.OAuthProvider("microsoft.com");
    loginWithProvider(provider);
};

// Cerrar sesión
document.getElementById("logout").onclick = () => {
    auth.signOut().then(() => {
        document.getElementById("user-status").textContent = "No has iniciado sesión";
        document.getElementById("google-login").style.display = "inline";
        document.getElementById("microsoft-login").style.display = "inline";
        document.getElementById("logout").style.display = "none";
        // Limpiar carrito al cerrar sesión
        carrito = [];
        actualizarCarrito();
    });
};

// Monitorear el estado de autenticación
auth.onAuthStateChanged((user) => {
    if (user) {
        const email = user.email;
        const domain = email.split('@')[1];
        const allowedDomains = ["ucatolica.edu.co", "gmail.com"];
        if (allowedDomains.includes(domain)) {
            usuarioLogueado = true;
            document.getElementById("user-status").textContent = `Bienvenido, ${user.displayName}`;
            document.getElementById("google-login").style.display = "none";
            document.getElementById("microsoft-login").style.display = "none";
            document.getElementById("logout").style.display = "inline";
        }
    } else {
        usuarioLogueado = false;
        document.getElementById("user-status").textContent = "No has iniciado sesión";
        document.getElementById("google-login").style.display = "inline";
        document.getElementById("microsoft-login").style.display = "inline";
        document.getElementById("logout").style.display = "none";
    }
});

// ------------------- Productos ----------------------
const productos = {
    almuerzo: {
        nombre: "Almuerzo Ejecutivo",
        precio: 12000
    },
    hamburguesa: {
        nombre: "Hamburguesa de la Casa",
        precio: 10000
    },
    perro: {
        nombre: "Perro Caliente",
        precio: 7000
    },
    bebida: {
        nombre: "Bebidas Refrescantes",
        precio: 2000
    },
    brownie: {
        nombre: "Brownie de Chocolate",
        precio: 5000
    },
    empanada: {
        nombre: "Empanada de Pollo",
        precio: 3000
    },
    arepa: {
        nombre: "Arepa con Queso",
        precio: 4000
    },
    limonada: {
        nombre: "Limonada de Coco",
        precio: 6000
    }
};

let carrito = [];

// Función para agregar productos al carrito
function agregarProductoAlCarrito(productoId) {
    if (!usuarioLogueado) {
        alert("Debes iniciar sesión para agregar productos al carrito.");
        return;
    }

    const inputCantidad = document.getElementById(`cantidad-${productoId}`);
    const cantidad = inputCantidad ? parseInt(inputCantidad.value) : 1;

    if (isNaN(cantidad) || cantidad < 1) {
        alert("Por favor ingresa una cantidad válida.");
        return;
    }

    // Verificar si el producto existe
    if (!productos[productoId]) {
        alert("Producto no encontrado.");
        return;
    }

    // Agregar la cantidad especificada al carrito
    for (let i = 0; i < cantidad; i++) {
        carrito.push({
            id: productoId,
            nombre: productos[productoId].nombre,
            precio: productos[productoId].precio
        });
    }

    // Resetear el input de cantidad
    if (inputCantidad) {
        inputCantidad.value = 1;
    }

    actualizarCarrito();
    alert(`${cantidad} ${productos[productoId].nombre}(s) agregado(s) al carrito!`);
}

// Función para abrir/cerrar el carrito
function AbrirElCarrito() {
    const nav = document.getElementById("carrito");
    if (nav.style.display === "block") {
        nav.style.display = "none";
    } else {
        nav.style.display = "block";
        nav.style.right = "0";
    }
}

function cerrarCarrito() {
    const nav = document.getElementById("carrito");
    nav.style.display = "none";
}

// Función para actualizar el carrito
function actualizarCarrito() {
    const contenedor = document.getElementById("productosAgregadosAlCarrito");
    const totalLabel = document.getElementById("total");
    const titulo = document.getElementById("tituloDeCarrito");
    const envio = 5000;

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

    // Actualizar título y mostrar elementos
    titulo.textContent = "Productos en tu carrito:";
    contenedor.classList.remove("none");
    totalLabel.parentElement.classList.remove("none");
    document.querySelector(".delivery-form").classList.remove("none");
    document.querySelector(".checkout-btn").classList.remove("none");
    document.getElementById("metodoPago").classList.remove("none");

    // Calcular y mostrar total
    const total = subtotal + envio;
    totalLabel.innerHTML = `<span>Total:</span><span>$${total.toLocaleString()} COP</span>`;
    
    // Actualizar costo de envío
    const shippingElement = document.querySelector(".shipping-cost");
    if (shippingElement) {
        shippingElement.innerHTML = `<span><i class="fas fa-truck"></i> Envío:</span><span>$${envio.toLocaleString()} COP</span>`;
    }
}

// Función para eliminar productos del carrito
function eliminarProductoDelCarrito(index) {
    if (index >= 0 && index < carrito.length) {
        const productoEliminado = carrito[index];
        carrito.splice(index, 1);
        actualizarCarrito();
        alert(`${productoEliminado.nombre} eliminado del carrito`);
    }
}

// Función para realizar la compra
function RealizarCompra() {
    if (!usuarioLogueado) {
        alert("Debes iniciar sesión para realizar una compra.");
        return;
    }

    if (carrito.length === 0) {
        alert("Tu carrito está vacío. Agrega algunos productos antes de realizar el pedido.");
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

    // Simular procesamiento del pedido
    setTimeout(() => {
        // Calcular totales
        const subtotal = carrito.reduce((total, item) => total + item.precio, 0);
        const envio = 5000;
        const total = subtotal + envio;

        // Crear resumen del pedido
        const resumenProductos = carrito.map(item => `- ${item.nombre}: $${item.precio.toLocaleString()} COP`).join('\n');
        
        const resumenPedido = `
🍽️ PEDIDO CONFIRMADO - BLESSEDFOOD 🍽️

📋 PRODUCTOS:
${resumenProductos}

💰 RESUMEN:
Subtotal: $${subtotal.toLocaleString()} COP
Envío: $${envio.toLocaleString()} COP
TOTAL: $${total.toLocaleString()} COP

📍 DIRECCIÓN DE ENTREGA:
${direccion}

💳 MÉTODO DE PAGO:
${metodoPago === 'nequi' ? '💜 Nequi' : metodoPago === 'daviplata' ? '🔴 Daviplata' : '💵 Efectivo'}

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

        // Ocultar modal de procesamiento
        document.getElementById("procesando").classList.add("none");

        // Mensaje final
        setTimeout(() => {
            alert("📱 Recibirás una notificación cuando tu pedido esté en camino. ¡Que disfrutes tu comida!");
        }, 1000);

    }, 3000); // Simular 3 segundos de procesamiento
}

// Función para toggle del modo oscuro
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

// Cargar preferencia de modo oscuro al iniciar
document.addEventListener('DOMContentLoaded', function() {
    const darkModePreference = localStorage.getItem('dark-mode');
    if (darkModePreference === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('modoOscuroToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
});

// Función para cerrar el carrito al hacer click fuera de él
document.addEventListener('click', function(event) {
    const carrito = document.getElementById('carrito');
    const iconoCarrito = document.getElementById('iconoDelCarrito');
    
    if (carrito.style.display === 'block' && 
        !carrito.contains(event.target) && 
        !iconoCarrito.contains(event.target)) {
        cerrarCarrito();
    }
});

// Prevenir que el carrito se cierre al hacer click dentro de él
document.getElementById('carrito').addEventListener('click', function(event) {
    event.stopPropagation();
});

// Función mejorada de búsqueda con filtros avanzados
function buscarProducto() {
    const input = document.getElementById('buscador');
    const filter = input.value.toLowerCase().trim();
    const productos = document.querySelectorAll('.product-card');

    if (filter === '') {
        // Mostrar todos los productos si no hay filtro
        productos.forEach(producto => {
            producto.style.display = "block";
        });
        return;
    }

    productos.forEach(producto => {
        const nombre = producto.querySelector('.product-title').innerText.toLowerCase();
        const descripcion = producto.querySelector('.product-description').innerText.toLowerCase();
        const precio = producto.querySelector('.product-price').innerText.toLowerCase();
        
        // Buscar en nombre, descripción y precio
        if (nombre.includes(filter) || descripcion.includes(filter) || precio.includes(filter)) {
            producto.style.display = "block";
            // Efecto de highlight para resultados encontrados
            producto.style.animation = "highlight 0.5s ease-in-out";
        } else {
            producto.style.display = "none";
        }
    });
}

// Agregar animación CSS para highlight
const style = document.createElement('style');
style.textContent = `
    @keyframes highlight {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Función para mostrar notificaciones toast
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `toast toast-${tipo}`;
    notificacion.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${mensaje}</span>
    `;
    
    // Estilos para la notificación
    notificacion.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${tipo === 'success' ? '#28a745' : tipo === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notificacion);
    
    // Animar entrada
    setTimeout(() => {
        notificacion.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notificacion.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notificacion);
        }, 300);
    }, 3000);
}
