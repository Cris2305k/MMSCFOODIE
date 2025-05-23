// ===============================
// Estado y autenticación simulada
// ===============================
let usuarioActual = null;
let productos = JSON.parse(localStorage.getItem("productos")) || [];
let carrito = [];

// Simula login
document.getElementById("google-login").onclick = () => login("usuario");
document.getElementById("microsoft-login").onclick = () => login("admin");
document.getElementById("logout").onclick = logout;

function login(tipo) {
  usuarioActual = {
    nombre: tipo === "admin" ? "Administrador" : "Cliente",
    rol: tipo === "admin" ? "admin" : "usuario",
  };
  document.getElementById("user-status").textContent = `Sesión iniciada como: ${usuarioActual.nombre}`;
  document.getElementById("logout").style.display = "inline-block";
  document.getElementById("google-login").style.display = "none";
  document.getElementById("microsoft-login").style.display = "none";
  document.getElementById("btnHistorial").style.display = "inline-block";

  if (usuarioActual.rol === "admin") {
    document.getElementById("admin-panel").style.display = "block";
  }
  renderizarProductos();
}

function logout() {
  usuarioActual = null;
  document.getElementById("user-status").textContent = "No has iniciado sesión";
  document.getElementById("logout").style.display = "none";
  document.getElementById("google-login").style.display = "inline-block";
  document.getElementById("microsoft-login").style.display = "inline-block";
  document.getElementById("btnHistorial").style.display = "none";
  document.getElementById("admin-panel").style.display = "none";
}

// ===============================
// Gestión de productos
// ===============================
document.getElementById("formulario-admin").addEventListener("submit", function (e) {
  e.preventDefault();
  const nombre = document.getElementById("nombreProducto").value;
  const descripcion = document.getElementById("descripcionProducto").value;
  const precio = parseInt(document.getElementById("precioProducto").value);
  const imagen = document.getElementById("imagenProducto").value;

  productos.push({ id: Date.now(), nombre, descripcion, precio, imagen });
  localStorage.setItem("productos", JSON.stringify(productos));
  this.reset();
  renderizarProductos();
});

function renderizarProductos() {
  const contenedor = document.getElementById("catalogo-productos");
  const adminContenedor = document.getElementById("admin-productos");
  contenedor.innerHTML = "";
  adminContenedor.innerHTML = "";

  const filtro = document.getElementById("buscador").value.toLowerCase();

  productos
    .filter(p => p.nombre.toLowerCase().includes(filtro))
    .forEach(producto => {
      // Para todos
      const card = document.createElement("article");
      card.innerHTML = `
        <img src="${producto.imagen}" alt="${producto.nombre}">
        <h2>${producto.nombre}</h2>
        <h4>${producto.descripcion}</h4>
        <p>Precio: $${producto.precio}</p>
        <button class="agregar" onclick="agregarAlCarrito(${producto.id})">Agregar al carrito</button>
      `;
      contenedor.appendChild(card);

      // Para admin
      if (usuarioActual?.rol === "admin") {
        const adminCard = document.createElement("article");
        adminCard.innerHTML = `
          <img src="${producto.imagen}" alt="${producto.nombre}">
          <h2>${producto.nombre}</h2>
          <p>$${producto.precio}</p>
          <button class="editar" onclick="editarProducto(${producto.id})">✏️ Editar</button>
          <button class="eliminar" onclick="eliminarProducto(${producto.id})">🗑️ Eliminar</button>
        `;
        adminContenedor.appendChild(adminCard);
      }
    });
}

function eliminarProducto(id) {
  productos = productos.filter(p => p.id !== id);
  localStorage.setItem("productos", JSON.stringify(productos));
  renderizarProductos();
}

function editarProducto(id) {
  const producto = productos.find(p => p.id === id);
  document.getElementById("nombreProducto").value = producto.nombre;
  document.getElementById("descripcionProducto").value = producto.descripcion;
  document.getElementById("precioProducto").value = producto.precio;
  document.getElementById("imagenProducto").value = producto.imagen;
  eliminarProducto(id);
}

// ===============================
// Buscador
// ===============================
document.getElementById("buscador").addEventListener("input", renderizarProductos);

// ===============================
// Carrito de compras
// ===============================
function agregarAlCarrito(id) {
  const producto = productos.find(p => p.id === id);
  const item = carrito.find(p => p.id === id);
  if (item) {
    item.cantidad++;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }
  mostrarCarrito();
}

function mostrarCarrito() {
  document.getElementById("carrito").style.display = "block";
  const contenedor = document.getElementById("productosAgregadosAlCarrito");
  contenedor.innerHTML = "";

  let total = 5000; // Envío

  carrito.forEach(p => {
    total += p.precio * p.cantidad;
    const div = document.createElement("div");
    div.innerHTML = `
      <p><strong>${p.nombre}</strong> - $${p.precio} x ${p.cantidad}</p>
      <button onclick="cambiarCantidad(${p.id}, -1)">➖</button>
      <button onclick="cambiarCantidad(${p.id}, 1)">➕</button>
    `;
    contenedor.appendChild(div);
  });

  document.getElementById("total").textContent = `Total: $${total}`;
  document.getElementById("tituloDeCarrito").textContent = carrito.length ? "Tu carrito:" : "Aún no has agregado productos al carrito";
}

function cambiarCantidad(id, delta) {
  const item = carrito.find(p => p.id === id);
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) {
    carrito = carrito.filter(p => p.id !== id);
  }
  mostrarCarrito();
}

function AbrirElCarrito() {
  document.getElementById("carrito").style.display = "block";
}

function cerrarCarrito() {
  document.getElementById("carrito").style.display = "none";
}

function RealizarCompra() {
  const direccion = document.getElementById("direccion").value.trim();
  if (!direccion) {
    document.getElementById("advertencia").style.display = "block";
    return;
  }
  document.getElementById("advertencia").style.display = "none";
  document.getElementById("procesando").classList.remove("none");

  setTimeout(() => {
    carrito = [];
    cerrarCarrito();
    document.getElementById("procesando").classList.add("none");
    alert("Compra realizada con éxito 🎉");
    mostrarCarrito();
  }, 2000);
}

// ===============================
// Modo oscuro
// ===============================
function toggleModoOscuro() {
  document.body.classList.toggle("dark-mode");
}

// ===============================
// ¿Quiénes somos?
// ===============================
function toggleQuienesSomos() {
  const info = document.getElementById("info-integrantes");
  info.style.display = info.style.display === "none" ? "block" : "none";
}
