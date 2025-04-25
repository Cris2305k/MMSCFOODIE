// Firebase
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
  const db = firebase.firestore();
  
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  
  function loginWithProvider(provider) {
    auth.signInWithRedirect(provider);
  }
  
  document.getElementById("google-login").onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    loginWithProvider(provider);
  };
  
  document.getElementById("microsoft-login").onclick = () => {
    const provider = new firebase.auth.OAuthProvider("microsoft.com");
    loginWithProvider(provider);
  };
  
  document.getElementById("logout").onclick = () => {
    auth.signOut().then(() => {
      document.getElementById("user-status").textContent = "No has iniciado sesión";
      document.getElementById("google-login").style.display = "inline";
      document.getElementById("microsoft-login").style.display = "inline";
      document.getElementById("logout").style.display = "none";
    }).catch((error) => {
      console.error("Error al cerrar sesión:", error);
      alert("Hubo un error al cerrar sesión. Intenta nuevamente.");
    });
  };
  
  auth.getRedirectResult().then(async (result) => {
    if (result.user) {
      const user = result.user;
      const email = user.email;
      const domain = email.split("@")[1];
      const allowedDomains = ["ucatolica.edu", "gmail.com"];
  
      if (allowedDomains.includes(domain)) {
        document.getElementById("user-status").textContent = `Bienvenido, ${user.displayName}`;
        document.getElementById("google-login").style.display = "none";
        document.getElementById("microsoft-login").style.display = "none";
        document.getElementById("logout").style.display = "inline";
  
        const userRef = db.collection("usuarios").doc(user.uid);
        const doc = await userRef.get();
  
        if (!doc.exists) {
          await userRef.set({
            nombre: user.displayName,
            direccion: "",
            telefono: "",
            historialPedidos: [],
            fechaRegistro: new Date().toISOString(),
            rol: "admin"
          });
        }
      } else {
        auth.signOut();
        alert("Correo no autorizado");
      }
    }
  }).catch((error) => {
    console.error("Error en la redirección:", error);
    alert("Error en la redirección");
  }).finally(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        const email = user.email;
        const domain = email.split('@')[1];
        const allowedDomains = ["ucatolica.edu", "gmail.com"];
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
  });
  const productos = {
    almuerzo: { nombre: "Almuerzo Ejecutivo", precio: 12000 },
    hamburguesa: { nombre: "Hamburguesa de la Casa", precio: 10000 },
    perro: { nombre: "Perro Caliente", precio: 7000 },
    bebida: { nombre: "Bebida", precio: 2000 }
  };
  
  let carrito = [];
  
  function agregarProductoAlCarrito(idProducto) {
    const producto = productos[idProducto];
    if (!producto) return;

    // Aquí va tu lógica para mostrarlo en el carrito.
    console.log("Producto agregado:", producto.nombre, "-", producto.precio);

    // Ejemplo simple de agregar al DOM (puedes adaptarlo):
    const contenedor = document.getElementById("productosAgregadosAlCarrito");
    const item = document.createElement("p");
    item.textContent = `${producto.nombre} - $${producto.precio} COP`;
    contenedor.appendChild(item);
    contenedor.classList.remove("none");

    // Mostrar total y otros elementos si estaban ocultos
    document.getElementById("total").classList.remove("none");
    document.querySelector("h4").classList.remove("none");
    document.getElementById("btnFinalizarCompra").classList.remove("none");

  }
  
  function AbrirElCarrito() {
    const nav = document.getElementById("carrito");
    nav.style.display = nav.style.display === "block" ? "none" : "block";
  }
  
  function actualizarCarrito() {
    const contenedor = document.getElementById("productosAgregadosAlCarrito");
    const totalLabel = document.getElementById("total");
    const envioLabel = document.querySelector("h4");
    const titulo = document.getElementById("tituloDeCarrito");
    const metodoPago = document.getElementById("metodoPago");
    const envio = 5000;
  
    contenedor.innerHTML = "";
    let subtotal = 0;
  
    envioLabel.textContent = `Envío: $${envio.toLocaleString()} COP`;
    envioLabel.classList.remove("none");
  
    if (carrito.length === 0) {
      titulo.textContent = "Aún no has agregado productos al carrito";
      totalLabel.classList.add("none");
      contenedor.classList.add("none");
      metodoPago.classList.add("none");
      document.querySelector("form").classList.add("none");
      document.querySelector("button").classList.add("none");
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
    metodoPago.classList.remove("none");
    document.querySelector("form").classList.remove("none");
    document.querySelector("button").classList.remove("none");
  
    const total = subtotal + envio;
    totalLabel.textContent = `Total: $${total.toLocaleString()} COP`;
  }
  
  function eliminarProductoDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
  }
  
  function cerrarCarrito() {
    const nav = document.getElementById("carrito");
    nav.style.display = "none";
  }
  
  function toggleModoOscuro() {
    document.body.classList.toggle("dark-mode");
  }
  
  function calcularTotal() {
    const subtotal = carrito.reduce((sum, prod) => sum + prod.precio, 0);
    return `$${(subtotal + 5000).toLocaleString()} COP`;
  }
  
  function RealizarCompra() {
    const direccion = document.getElementById("direccion").value.trim();
    const metodoPago = document.getElementById("pago").value;
    const advertencia = document.getElementById("advertencia");
  
    if (direccion.length < 5) {
      advertencia.classList.remove("none");
      return;
    }
  
    advertencia.classList.add("none");
  
    const pedido = {
      productos: carrito.map(p => p.nombre).join(', '),
      fecha: new Date().toLocaleString(),
      total: calcularTotal()
    };
  
    let historial = JSON.parse(localStorage.getItem("historialPedidos")) || [];
    historial.push(pedido);
    localStorage.setItem("historialPedidos", JSON.stringify(historial));
  
    mostrarHistorial();
    carrito = [];
    actualizarCarrito();
    document.getElementById("direccion").value = "";
    document.getElementById("modalConfirmacion").style.display = "block";
  }
  
  function cerrarModal() {
    document.getElementById("modalConfirmacion").style.display = "none";
  }
  
  function mostrarHistorial() {
    const lista = document.getElementById("listaPedidos");
    lista.innerHTML = "";
  
    const historial = JSON.parse(localStorage.getItem("historialPedidos")) || [];
  
    historial.forEach(pedido => {
      const item = document.createElement("li");
      item.textContent = `📅 ${pedido.fecha} - 🛒 ${pedido.productos} - 💰 ${pedido.total}`;
      lista.appendChild(item);
    });
  
    document.getElementById("historialPedidos").classList.remove("none");
  }
  
  function buscarProducto() {
    const texto = document.getElementById("buscador").value.toLowerCase();
    const articulos = document.querySelectorAll("section article");
  
    articulos.forEach(articulo => {
      const titulo = articulo.querySelector("h2").textContent.toLowerCase();
      articulo.style.display = titulo.includes(texto) ? "block" : "none";
    });
  }
