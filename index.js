//Firebase
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

// Función de login
function loginWithProvider(provider) {
  auth.signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      const email = user.email;
      const domain = email.split("@")[1];
      const allowedDomains = ["ucatolica.edu", "gmail.com"];

      if (allowedDomains.includes(domain)) {
        document.getElementById("user-status").textContent = `Bienvenido, ${user.displayName}`;
        document.getElementById("google-login").style.display = "none";
        document.getElementById("microsoft-login").style.display = "none";
        document.getElementById("logout").style.display = "inline";
      } else {
        auth.signOut();
        alert("Correo no autorizado");
      }
    })
    .catch((error) => {
      console.error(error);
      alert("Error en el login");
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
  });
};

// Monitorear el estado de autenticación
auth.onAuthStateChanged((user) => {
  if (user) {
    const email = user.email;
    const domain = email.split('@')[1];
    const allowedDomains = ["miuniversidad.edu", "gmail.com"];
    if (allowedDomains.includes(domain)) {
      document.getElementById("user-status").textContent = `Bienvenido, ${user.displayName}`;
      document.getElementById("google-login").style.display = "none";
      document.getElementById("microsoft-login").style.display = "none";
      document.getElementById("logout").style.display = "inline";
    }
  } else {
    document.getElementById("user-status").textContent = "No has iniciado sesión";
    document.getElementById("google-login").style.display = "inline";
    document.getElementById("microsoft-login").style.display = "inline";
    document.getElementById("logout").style.display = "none";
  }
});


// ------------------- Carrito de compras ----------------------

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
    nombre: "Bebida",
    precio: 2000
  }
};

let carrito = [];

function agregarProductoAlCarrito(tipo) {
  carrito.push(productos[tipo]);
  actualizarCarrito();
}

function AbrirElCarrito() {
  const nav = document.getElementById("carrito");
  nav.style.display = nav.style.display === "block" ? "none" : "block"; // Toggle carrito visibility
}

function actualizarCarrito() {
  const contenedor = document.getElementById("productosAgregadosAlCarrito");
  const totalLabel = document.getElementById("total");
  const envioLabel = document.querySelector("h4");
  document.getElementById("metodoPago").classList.remove("none");
  const titulo = document.getElementById("tituloDeCarrito");
  const envio = 5000;

  contenedor.innerHTML = "";
  let subtotal = 0;

  envioLabel.textContent = `Envío: $${envio.toLocaleString()} COP`;
  envioLabel.classList.remove("none");

  if (carrito.length === 0) {
    titulo.textContent = "Aún no has agregado productos al carrito";
    totalLabel.classList.add("none");
    contenedor.classList.add("none");
    document.querySelector("form").classList.add("none");
    document.querySelector("button").classList.add("none");
    document.getElementById("btnFinalizarCompra").classList.add("none");  // Ocultar el botón de finalizar compra
    return;
  }

  carrito.forEach((item, index) => {
    const div = document.createElement("div");
    div.textContent = `${item.nombre} - $${item.precio.toLocaleString()} COP`;

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "Eliminar";
    btnEliminar.onclick = () => eliminarProductoDelCarrito(index);
    btnEliminar.classList.add("boton-eliminar");

    div.appendChild(btnEliminar);
    contenedor.appendChild(div);
    subtotal += item.precio;
  });

  titulo.textContent = "Productos en tu carrito:";
  contenedor.classList.remove("none");
  totalLabel.classList.remove("none");
  document.querySelector("form").classList.remove("none");
  document.querySelector("button").classList.remove("none");
  document.getElementById("metodoPago").classList.remove("none");

  const total = subtotal + envio;
  totalLabel.textContent = `Total: $${total.toLocaleString()} COP`;

  document.getElementById("btnFinalizarCompra").classList.remove("none");  // Mostrar el botón de finalizar compra
}

function RealizarCompra() {
  const direccion = document.getElementById("direccion").value.trim();
  const metodoPago = document.getElementById("pago").value;
  const advertencia = document.getElementById("advertencia");
  const procesando = document.getElementById("procesando");

  if (direccion.length < 5) {
    advertencia.classList.remove("none");
    return;
  }

  advertencia.classList.add("none");
  procesando.classList.remove("none");

  setTimeout(() => {
    procesando.classList.add("none");
    alert(`✅ Tu pedido será entregado en: ${direccion}\n💳 Método de pago: ${metodoPago.toUpperCase()}\n¡Gracias por comprar en BLESSEDFOOD! 😋`);

    carrito = [];
    document.getElementById("direccion").value = "";
    actualizarCarrito();
    document.getElementById("metodoPago").classList.add("none");
  }, 2000);
}

function cerrarCarrito() {
  const nav = document.getElementById("carrito");
  nav.style.display = "none";
}

function eliminarProductoDelCarrito(index) {
  carrito.splice(index, 1);
  actualizarCarrito();
}

function toggleModoOscuro() {
  document.body.classList.toggle("dark-mode");
}


// Obtener cantidad seleccionada
function obtenerCantidad(tipo) {
  const input = document.getElementById(`cantidad-${tipo}`);
  return input ? parseInt(input.value) || 1 : 1;
}

// Modificar agregarProductoAlCarrito para que permita múltiples cantidades
function agregarProductoAlCarrito(tipo) {
  const cantidad = obtenerCantidad(tipo);
  for (let i = 0; i < cantidad; i++) {
    carrito.push(productos[tipo]);
  }
  actualizarCarrito();
}

// Redirección a Nequi o Daviplata
function RealizarCompra() {
  const direccion = document.getElementById("direccion").value.trim();
  const metodoPago = document.getElementById("pago").value;
  const advertencia = document.getElementById("advertencia");
  const procesando = document.getElementById("procesando");

  if (direccion.length < 5) {
    advertencia.classList.remove("none");
    return;
  }

  advertencia.classList.add("none");
  procesando.classList.remove("none");

  setTimeout(() => {
    procesando.classList.add("none");
    guardarHistorial();

    const url = metodoPago === "nequi"
      ? "https://www.nequi.com.co/"
      : "https://www.daviplata.com/wps/portal/daviplata/";

    window.open(url, '_blank');
    alert(`✅ Pedido en camino a: ${direccion}\n💳 Pago: ${metodoPago.toUpperCase()}`);
    
    carrito = [];
    document.getElementById("direccion").value = "";
    actualizarCarrito();
    document.getElementById("metodoPago").classList.add("none");
  }, 2000);
}

// Guardar historial en localStorage
function guardarHistorial() {
  const historial = JSON.parse(localStorage.getItem("historialCompras")) || [];
  historial.push({
    fecha: new Date().toLocaleString(),
    pedido: [...carrito]
  });
  localStorage.setItem("historialCompras", JSON.stringify(historial));
  mostrarHistorial();
}

// Mostrar historial si está logueado
function mostrarHistorial() {
  const user = auth.currentUser;
  if (!user) return;

  const historialSection = document.getElementById("historial");
  const contenedor = document.getElementById("contenedor-historial");

  historialSection.style.display = "block";
  contenedor.innerHTML = "";

  const historial = JSON.parse(localStorage.getItem("historialCompras")) || [];

  if (historial.length === 0) {
    contenedor.innerHTML = "<p>No hay historial de compras aún.</p>";
    return;
  }

  historial.forEach((compra, i) => {
    const div = document.createElement("div");
    div.innerHTML = `<strong>Compra #${i + 1}</strong> - ${compra.fecha}<br>` +
      compra.pedido.map(p => `• ${p.nombre} - $${p.precio.toLocaleString()} COP`).join("<br>");
    div.classList.add("compra");
    contenedor.appendChild(div);
  });
}

// Mostrar historial automáticamente si hay login
auth.onAuthStateChanged((user) => {
  if (user) {
    mostrarHistorial();
  }
});
