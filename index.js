
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
    nav.style.display = nav.style.display === "block" ? "none" : "block";
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
  
  
