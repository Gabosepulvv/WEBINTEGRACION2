// ==============================
// FUNCIONES DE UTILIDAD (HECHO A LAS 9:15 AM)
// ==============================
function getImageUrl(imageName) {
  return `img/${imageName}`; // Busca las imágenes en la carpeta img local
}

function actualizarStock(productoId, cantidad) {
  return db.collection("Productos").doc(productoId).get()
    .then(doc => {
      if (doc.exists) {
        const stockActual = doc.data().stock || 0;
        const nuevoStock = Math.max(0, stockActual - cantidad);
        return db.collection("Productos").doc(productoId).update({
          stock: nuevoStock
        });
      }
    })
    .catch(error => {
      console.error("Error al actualizar stock:", error);
    });
}

// ==============================
// MOSTRAR PRODUCTOS EN index.html (inicio) (HECHO A LAS 9:15 AM)
// ==============================
const listaPreview = document.getElementById("preview-catalogo");

if (listaPreview) {
  db.collection("Productos").limit(4).get().then(snapshot => {
    snapshot.forEach(doc => {
      const prod = doc.data();
      const stock = prod.stock || 0;

      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <img src="${getImageUrl(prod.imagen)}" alt="${prod.nombre}" class="producto-img" onerror="this.src='img/no-image.jpg'">
        <h3>${prod.nombre}</h3>
        <p>${prod.descripcion}</p>
        <p><strong>Precio:</strong> $${prod.precioNormal.toLocaleString('es-CL')} CLP</p>
        <p class="stock ${stock > 0 ? 'en-stock' : 'sin-stock'}">
          <strong>Stock:</strong> ${stock} unidades
        </p>
      `;
      listaPreview.appendChild(div);
    });
  }).catch(error => {
    console.error("Error al cargar productos en inicio:", error);
  });
}

// ==============================
// MOSTRAR TODOS LOS PRODUCTOS EN catalogo.html CON PRECIO SEGÚN ROL Y NUEVO DISEÑO
// ==============================
const contenedorCatalogo = document.getElementById("catalogo-productos");

if (contenedorCatalogo) {
  const user = auth.currentUser;

  auth.onAuthStateChanged(user => {
    const rolDefault = "cliente";
    let rolUsuario = rolDefault;

    if (user) {
      db.collection("usuarios").doc(user.uid).get().then(doc => {
        rolUsuario = doc.exists ? doc.data().rol : rolDefault;
        mostrarProductosCatalogo(rolUsuario);
      });
    } else {
      mostrarProductosCatalogo(rolUsuario);
    }
  });

  function mostrarProductosCatalogo(rol) {
    db.collection("Productos").get().then(snapshot => {
      snapshot.forEach(doc => {
        const prod = doc.data();
        const stock = prod.stock || 0;
        const precioB2B = prod.precioB2B || prod.precioNormal;

        const div = document.createElement("div");
        div.className = "fila-producto";
        div.innerHTML = `
          <img src="${getImageUrl(prod.imagen)}" alt="${prod.nombre}" class="producto-img" onerror="this.src='img/no-image.jpg'">
          <div class="info-producto">
            <h3>${prod.nombre}</h3>
            <p>${prod.descripcion}</p>
            <p><strong>Precio Cliente:</strong> $${prod.precioNormal.toLocaleString('es-CL')} CLP</p>
            ${rol === 'distribuidor' ? `<p><strong>Precio Distribuidor:</strong> $${precioB2B.toLocaleString('es-CL')} CLP</p>` : ''}
            <p class="stock ${stock > 0 ? 'en-stock' : 'sin-stock'}">
              <strong>Stock disponible:</strong> ${stock} unidades
            </p>
          </div>
        `;
        contenedorCatalogo.appendChild(div);
      });
    }).catch(error => {
      console.error("Error al cargar productos:", error);
    });
  }
}

// ==============================
// MOSTRAR PRODUCTOS EN cliente.html (HECHO A LAS 9:15 AM)
// ==============================
const contenedorCliente = document.getElementById("productos-cliente");

if (contenedorCliente) {
  db.collection("Productos").get().then(snapshot => {
    snapshot.forEach(doc => {
      const prod = doc.data();
      const stock = prod.stock || 0;

      const div = document.createElement("div");
      div.className = "fila-producto";
      div.innerHTML = `
        <img src="${getImageUrl(prod.imagen)}" alt="${prod.nombre}" class="producto-img" onerror="this.src='img/no-image.jpg'">
        <div class="info-producto">
          <h3>${prod.nombre}</h3>
          <p>${prod.descripcion}</p>
          <p><strong>Precio:</strong> $${prod.precioNormal.toLocaleString('es-CL')} CLP</p>
          <p class="stock ${stock > 0 ? 'en-stock' : 'sin-stock'}">
            <strong>Stock disponible:</strong> ${stock} unidades
          </p>
          <button 
            onclick="agregarAlCarrito('${doc.id}', '${prod.nombre}', ${prod.precioNormal}, '${prod.imagen}')"
            ${stock <= 0 ? 'disabled' : ''}
            class="btn-agregar ${stock <= 0 ? 'disabled' : ''}"
          >
            ${stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
          </button>
        </div>
      `;
      contenedorCliente.appendChild(div);
    });
  }).catch(error => {
    console.error("Error al cargar productos para cliente:", error);
  });
}

// ==============================
// MOSTRAR PRODUCTOS EN distribuidor.html (HECHO A LAS 9:15 AM)
// ==============================
const contenedorDistribuidor = document.getElementById("productos-distribuidor");

if (contenedorDistribuidor) {
  db.collection("Productos").get().then(snapshot => {
    snapshot.forEach(doc => {
      const prod = doc.data();
      const stock = prod.stock || 0;
      const precioB2B = prod.precioB2B || prod.precioNormal;

      const div = document.createElement("div");
      div.className = "fila-producto";
      div.innerHTML = `
        <img src="${getImageUrl(prod.imagen)}" alt="${prod.nombre}" class="producto-img" onerror="this.src='img/no-image.jpg'">
        <div class="info-producto">
          <h3>${prod.nombre}</h3>
          <p>${prod.descripcion}</p>
          <p><strong>Precio Distribuidor:</strong> $${precioB2B.toLocaleString('es-CL')} CLP</p>
          <p class="stock ${stock > 0 ? 'en-stock' : 'sin-stock'}">
            <strong>Stock disponible:</strong> ${stock} unidades
          </p>
          <button 
            onclick="agregarAlCarrito('${doc.id}', '${prod.nombre}', ${precioB2B}, '${prod.imagen}')"
            ${stock <= 0 ? 'disabled' : ''}
            class="btn-agregar ${stock <= 0 ? 'disabled' : ''}"
          >
            ${stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
          </button>
        </div>
      `;
      contenedorDistribuidor.appendChild(div);
    });
  }).catch(error => {
    console.error("Error al cargar productos para distribuidor:", error);
  });
}

// ==============================
// CARRITO Y COMPRAS (HECHO A LAS 9:15 AM)
// ==============================
let carrito = [];

function agregarAlCarrito(id, nombre, precio, imagen) {
  const item = carrito.find(i => i.id === id);
  
  if (item) {
    // Verificar stock antes de incrementar
    db.collection("Productos").doc(id).get().then(doc => {
      if (doc.exists) {
        const stockActual = doc.data().stock || 0;
        if (stockActual > item.cantidad) {
          item.cantidad++;
          localStorage.setItem("carrito", JSON.stringify(carrito));
          actualizarCarritoUI();
        } else {
          alert("No hay suficiente stock disponible");
        }
      }
    });
  } else {
    carrito.push({
      id,
      nombre,
      precio,
      imagen: getImageUrl(imagen),
      cantidad: 1
    });
    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarCarritoUI();
  }
}

function actualizarCarritoUI() {
  const contenido = document.getElementById("carritoContenido");
  const total = document.getElementById("carritoTotal");
  
  if (!contenido) return;
  
  contenido.innerHTML = "";
  let totalPrecio = 0;
  
  carrito.forEach(item => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "item-carrito";
    itemDiv.innerHTML = `
      <img src="${item.imagen}" alt="${item.nombre}" onerror="this.src='img/no-image.jpg'">
      <div class="item-carrito-info">
        <div class="item-carrito-nombre">${item.nombre}</div>
        <div class="item-carrito-precio">$${item.precio.toLocaleString('es-CL')} x ${item.cantidad}</div>
      </div>
      <button class="item-carrito-eliminar" onclick="eliminarDelCarrito('${item.id}')">×</button>
    `;
    contenido.appendChild(itemDiv);
    totalPrecio += item.precio * item.cantidad;
  });
  
  if (total) {
    total.textContent = totalPrecio.toLocaleString('es-CL');
  }
}

function eliminarDelCarrito(id) {
  carrito = carrito.filter(item => item.id !== id);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarCarritoUI();
}

function toggleCarrito() {
  const sidebar = document.getElementById("carritoSidebar");
  if (sidebar) {
    sidebar.classList.toggle("active");
  }
}

// Cargar carrito al iniciar
document.addEventListener("DOMContentLoaded", () => {
  const carritoGuardado = localStorage.getItem("carrito");
  if (carritoGuardado) {
    carrito = JSON.parse(carritoGuardado);
    actualizarCarritoUI();
  }
});

// ==============================
// VALIDACIONES DE FORMULARIOS (HECHO A LAS 9:15 AM)
// ==============================
function validarEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validarPassword(password) {
  return password.length >= 6;
}

function validarTelefono(telefono) {
  const re = /^\d{9}$/;  // 9 dígitos
  return re.test(telefono);
}

function mostrarError(elementId, mensaje) {
  const errorElement = document.getElementById(`error-${elementId}`);
  if (errorElement) {
    errorElement.textContent = mensaje;
    errorElement.style.display = 'block';
    document.getElementById(elementId).classList.add('campo-invalido');
  }
}

function ocultarError(elementId) {
  const errorElement = document.getElementById(`error-${elementId}`);
  if (errorElement) {
    errorElement.style.display = 'none';
    document.getElementById(elementId).classList.remove('campo-invalido');
  }
}

// ==============================
// REGISTRO DE USUARIOS (registro.html)
// ==============================
const formRegistro = document.getElementById("formRegistro");

if (formRegistro) {
  const campos = ['nombre', 'correo', 'password', 'rol'];
  
  // Agregar validación en tiempo real
  campos.forEach(campo => {
    const input = document.getElementById(campo);
    if (input) {
      input.addEventListener('input', () => {
        validarCampo(campo, input.value);
      });
    }
  });

  formRegistro.addEventListener("submit", (e) => {
    e.preventDefault();
    let isValid = true;

    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const rol = document.getElementById("rol").value;

    // Validar nombre
    if (!nombre) {
      mostrarError('nombre', 'El nombre es obligatorio');
      isValid = false;
    } else {
      ocultarError('nombre');
    }

    // Validar correo
    if (!correo) {
      mostrarError('correo', 'El correo es obligatorio');
      isValid = false;
    } else if (!validarEmail(correo)) {
      mostrarError('correo', 'Ingresa un correo electrónico válido');
      isValid = false;
    } else {
      ocultarError('correo');
    }

    // Validar contraseña
    if (!password) {
      mostrarError('password', 'La contraseña es obligatoria');
      isValid = false;
    } else if (!validarPassword(password)) {
      mostrarError('password', 'La contraseña debe tener al menos 6 caracteres');
      isValid = false;
    } else {
      ocultarError('password');
    }

    // Validar rol
    if (!rol) {
      mostrarError('rol', 'Selecciona un tipo de cuenta');
      isValid = false;
    } else {
      ocultarError('rol');
    }

    if (isValid) {
      auth.createUserWithEmailAndPassword(correo, password)
        .then(cred => {
          return db.collection("usuarios").doc(cred.user.uid).set({
            nombre,
            correo,
            rol
          });
        })
        .then(() => {
          alert("Registro exitoso");
          window.location.href = "login.html";
        })
        .catch(error => {
          if (error.code === 'auth/email-already-in-use') {
            mostrarError('correo', 'Este correo ya está registrado');
          } else {
            alert("Error: " + error.message);
          }
          console.error("Firebase error:", error);
        });
    }
  });
}

// ==============================
// LOGIN DE USUARIOS (login.html)
// ==============================
const formLogin = document.getElementById("formLogin");

if (formLogin) {
  formLogin.addEventListener("submit", (e) => {
    e.preventDefault();
    let isValid = true;

    const correo = document.getElementById("correoLogin").value.toLowerCase().trim();
    const password = document.getElementById("passwordLogin").value;

    // Validar correo
    if (!correo) {
      mostrarError('correoLogin', 'El correo es obligatorio');
      isValid = false;
    } else if (!validarEmail(correo)) {
      mostrarError('correoLogin', 'Ingresa un correo electrónico válido');
      isValid = false;
    } else {
      ocultarError('correoLogin');
    }

    // Validar contraseña
    if (!password) {
      mostrarError('passwordLogin', 'La contraseña es obligatoria');
      isValid = false;
    } else {
      ocultarError('passwordLogin');
    }

    if (isValid) {
      auth.signInWithEmailAndPassword(correo, password)
        .then(cred => {
          return db.collection("usuarios").doc(cred.user.uid).get();
        })
        .then(doc => {
          if (!doc.exists) {
            mostrarError('correoLogin', 'Usuario no encontrado');
            return;
          }

          const data = doc.data();
          const rol = data.rol;

          if (rol === "cliente") {
            window.location.href = "cliente.html";
          } else if (rol === "distribuidor") {
            window.location.href = "distribuidor.html";
          } else {
            mostrarError('correoLogin', 'Tipo de usuario no reconocido');
          }
        })
        .catch(error => {
          if (error.code === 'auth/user-not-found') {
            mostrarError('correoLogin', 'Usuario no encontrado');
          } else if (error.code === 'auth/wrong-password') {
            mostrarError('passwordLogin', 'Contraseña incorrecta');
          } else {
            alert("Error al iniciar sesión: " + error.message);
          }
          console.error("Login error:", error);
        });
    }
  });
}

// ==============================
// VALIDACIÓN FORMULARIO DE ENTREGA (HECHO A LAS 9:15 AM)
// ==============================
function validarFormularioEntrega() {
  let isValid = true;
  const tipoEntrega = document.querySelector('input[name="tipoEntrega"]:checked').value;

  if (tipoEntrega === "delivery") {
    // Validar nombre
    const nombre = document.getElementById("nombreEntrega").value.trim();
    if (!nombre) {
      mostrarError('nombreEntrega', 'El nombre es obligatorio');
      isValid = false;
    } else {
      ocultarError('nombreEntrega');
    }

    // Validar contacto (teléfono)
    const contacto = document.getElementById("contactoEntrega").value.trim();
    if (!contacto) {
      mostrarError('contactoEntrega', 'El número de contacto es obligatorio');
      isValid = false;
    } else if (!validarTelefono(contacto)) {
      mostrarError('contactoEntrega', 'Ingresa un número de teléfono válido (9 dígitos)');
      isValid = false;
    } else {
      ocultarError('contactoEntrega');
    }

    // Validar comuna
    const comuna = document.getElementById("comunaEntrega").value.trim();
    if (!comuna) {
      mostrarError('comunaEntrega', 'La comuna es obligatoria');
      isValid = false;
    } else {
      ocultarError('comunaEntrega');
    }
  }

  return isValid;
}

// Mostrar el formulario de entrega
function mostrarFormularioEntrega() {
  const formEntrega = document.getElementById("formEntrega");
  if (formEntrega) {
    formEntrega.style.display = "block";
  }
  
  const tipoEntrega = document.getElementsByName("tipoEntrega");
  tipoEntrega.forEach(radio => {
    radio.addEventListener("change", (e) => {
      const formDelivery = document.getElementById("formDelivery");
      if (formDelivery) {
        formDelivery.style.display = e.target.value === "delivery" ? "block" : "none";
      }
    });
  });
}

// Cerrar formulario
function cerrarFormulario() {
  const formEntrega = document.getElementById("formEntrega");
  if (formEntrega) {
    formEntrega.style.display = "none";
  }
}

// Confirmar pedido
function confirmarPedido() {
  if (!validarFormularioEntrega()) {
    return;
  }

  // Verificar que haya productos en el carrito
  if (carrito.length === 0) {
    alert("El carrito está vacío");
    return;
  }

  // Actualizar stock de productos
  const actualizaciones = carrito.map(item => {
    return actualizarStock(item.id, item.cantidad);
  });

  Promise.all(actualizaciones)
    .then(() => {
      alert("¡Pedido confirmado! Gracias por tu compra.");
      carrito = [];
      localStorage.removeItem("carrito");
      actualizarCarritoUI();
      cerrarFormulario();
    })
    .catch(error => {
      console.error("Error al procesar el pedido:", error);
      alert("Hubo un error al procesar tu pedido. Por favor, intenta nuevamente.");
    });
}

// Configuración de Firebase
const firebaseConfig = {
  // Tu configuración de Firebase aquí
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variables globales
let carrito = [];
let productos = [];
let esDistribuidor = false;

// Detectar si estamos en la página de distribuidor
document.addEventListener('DOMContentLoaded', () => {
  esDistribuidor = document.body.classList.contains('distribuidor-portal');
  cargarProductos();
  actualizarContadorCarrito();
});

// Función para cargar productos
async function cargarProductos() {
  try {
    const productosRef = await db.collection('productos').get();
    productos = productosRef.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    mostrarProductos(productos);
  } catch (error) {
    console.error('Error al cargar productos:', error);
    mostrarError('Error al cargar los productos. Por favor, intente más tarde.');
  }
}

// Función para mostrar productos
function mostrarProductos(productosAMostrar) {
  const contenedor = document.getElementById('productos-grid');
  contenedor.innerHTML = '';

  productosAMostrar.forEach(producto => {
    const precioFinal = esDistribuidor ? 
      calcularPrecioDistribuidor(producto.precio) : 
      producto.precio;

    const card = document.createElement('div');
    card.className = 'producto-card';
    card.innerHTML = `
      <img src="${producto.imagen}" alt="${producto.nombre}" class="producto-imagen">
      <div class="producto-info">
        <h3 class="producto-titulo">${producto.nombre}</h3>
        <p>${producto.descripcion}</p>
        <div class="producto-precio-container">
          ${esDistribuidor ? 
            `<span class="precio-original">$${producto.precio.toLocaleString('es-CL')}</span>` : 
            ''}
          <span class="producto-precio ${esDistribuidor ? 'precio-distribuidor' : ''}">
            $${precioFinal.toLocaleString('es-CL')}
          </span>
          ${esDistribuidor ? 
            '<span class="descuento-badge">-25%</span>' : 
            ''}
        </div>
        <button onclick="agregarAlCarrito('${producto.id}')" class="btn-primario">
          <i class="fas fa-shopping-cart"></i> Agregar al carrito
        </button>
      </div>
    `;
    contenedor.appendChild(card);
  });
}

// Función para calcular precio de distribuidor
function calcularPrecioDistribuidor(precioOriginal) {
  return precioOriginal * 0.75; // 25% de descuento
}

// Funciones del carrito
function toggleCarrito() {
  const sidebar = document.getElementById('carritoSidebar');
  sidebar.classList.toggle('active');
}

function agregarAlCarrito(productoId) {
  const producto = productos.find(p => p.id === productoId);
  if (!producto) return;

  const itemExistente = carrito.find(item => item.id === productoId);
  if (itemExistente) {
    itemExistente.cantidad++;
  } else {
    carrito.push({
      id: productoId,
      nombre: producto.nombre,
      precio: esDistribuidor ? calcularPrecioDistribuidor(producto.precio) : producto.precio,
      cantidad: 1,
      imagen: producto.imagen
    });
  }

  actualizarCarrito();
  mostrarNotificacion('Producto agregado al carrito');
}

function actualizarCarrito() {
  const contenedor = document.getElementById('carritoContenido');
  contenedor.innerHTML = '';

  let total = 0;

  carrito.forEach(item => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;

    const itemElement = document.createElement('div');
    itemElement.className = 'carrito-item';
    itemElement.innerHTML = `
      <img src="${item.imagen}" alt="${item.nombre}">
      <div class="item-info">
        <h4>${item.nombre}</h4>
        <p>$${item.precio.toLocaleString('es-CL')} x ${item.cantidad}</p>
        <div class="item-controles">
          <button onclick="cambiarCantidad('${item.id}', -1)">-</button>
          <span>${item.cantidad}</span>
          <button onclick="cambiarCantidad('${item.id}', 1)">+</button>
        </div>
      </div>
      <button onclick="eliminarDelCarrito('${item.id}')" class="btn-eliminar">
        <i class="fas fa-trash"></i>
      </button>
    `;
    contenedor.appendChild(itemElement);
  });

  if (esDistribuidor) {
    const subtotalElement = document.getElementById('subtotal');
    const descuentoElement = document.getElementById('descuento-total');
    const subtotal = total / 0.75;
    const descuento = subtotal - total;
    
    subtotalElement.textContent = subtotal.toLocaleString('es-CL');
    descuentoElement.textContent = descuento.toLocaleString('es-CL');
  }

  document.getElementById('carritoTotal').textContent = total.toLocaleString('es-CL');
  actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
  const contador = document.getElementById('carrito-contador');
  const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
  contador.textContent = totalItems;
}

function cambiarCantidad(productoId, cambio) {
  const item = carrito.find(i => i.id === productoId);
  if (item) {
    item.cantidad += cambio;
    if (item.cantidad <= 0) {
      eliminarDelCarrito(productoId);
    } else {
      actualizarCarrito();
    }
  }
}

function eliminarDelCarrito(productoId) {
  carrito = carrito.filter(item => item.id !== productoId);
  actualizarCarrito();
  mostrarNotificacion('Producto eliminado del carrito');
}

// Funciones de filtrado y búsqueda
function filtrarProductos(categoria) {
  const botones = document.querySelectorAll('.categoria-btn');
  botones.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  let productosFiltrados = productos;
  if (categoria !== 'todos') {
    productosFiltrados = productos.filter(p => p.categoria === categoria);
  }

  mostrarProductos(productosFiltrados);
}

// Función para buscar productos
document.getElementById('busqueda').addEventListener('input', (e) => {
  const busqueda = e.target.value.toLowerCase();
  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda) || 
    p.descripcion.toLowerCase().includes(busqueda)
  );
  mostrarProductos(productosFiltrados);
});

// Función para ordenar productos
document.getElementById('ordenar').addEventListener('change', (e) => {
  const criterio = e.target.value;
  let productosOrdenados = [...productos];

  switch (criterio) {
    case 'precio-bajo':
      productosOrdenados.sort((a, b) => a.precio - b.precio);
      break;
    case 'precio-alto':
      productosOrdenados.sort((a, b) => b.precio - a.precio);
      break;
    case 'descuento':
      if (esDistribuidor) {
        productosOrdenados.sort((a, b) => 
          (b.precio - calcularPrecioDistribuidor(b.precio)) - 
          (a.precio - calcularPrecioDistribuidor(a.precio))
        );
      }
      break;
  }

  mostrarProductos(productosOrdenados);
});

// Funciones del formulario
function mostrarFormularioEntrega() {
  document.getElementById('formEntrega').style.display = 'block';
}

function cerrarFormulario() {
  document.getElementById('formEntrega').style.display = 'none';
}

// Manejar tipo de entrega
document.querySelectorAll('input[name="tipoEntrega"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    const formDelivery = document.getElementById('formDelivery');
    formDelivery.style.display = e.target.value === 'delivery' ? 'block' : 'none';
  });
});

// Validación y envío del formulario
async function confirmarPedido() {
  if (!validarFormulario()) return;

  const formulario = document.getElementById('formularioEntrega');
  const datosFormulario = new FormData(formulario);
  
  try {
    // Aquí iría la lógica para enviar el pedido a Firebase
    await guardarPedido(Object.fromEntries(datosFormulario));
    
    carrito = [];
    actualizarCarrito();
    cerrarFormulario();
    mostrarNotificacion('¡Pedido realizado con éxito!', 'success');
  } catch (error) {
    console.error('Error al procesar el pedido:', error);
    mostrarNotificacion('Error al procesar el pedido. Por favor, intente nuevamente.', 'error');
  }
}

function validarFormulario() {
  const campos = document.querySelectorAll('#formularioEntrega input[required]');
  let valido = true;

  campos.forEach(campo => {
    const errorElement = document.getElementById(`error${campo.id}`);
    if (!campo.value.trim()) {
      errorElement.textContent = 'Este campo es requerido';
      valido = false;
    } else {
      errorElement.textContent = '';
    }
  });

  return valido;
}

// Funciones de utilidad
function mostrarNotificacion(mensaje, tipo = 'info') {
  // Implementar sistema de notificaciones
  alert(mensaje);
}

function mostrarError(mensaje) {
  // Implementar sistema de errores
  console.error(mensaje);
  alert(mensaje);
}

// Funciones específicas para distribuidores
if (esDistribuidor) {
  // Actualizar estadísticas del dashboard
  async function actualizarEstadisticas() {
    try {
      const stats = await obtenerEstadisticasDistribuidor();
      document.getElementById('pedidos-mes').textContent = stats.pedidosMes;
      document.getElementById('total-ahorrado').textContent = 
        `$${stats.totalAhorrado.toLocaleString()}`;
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }

  // Filtrar por cantidad mínima
  document.getElementById('cantidad-minima').addEventListener('change', (e) => {
    const minimo = parseInt(e.target.value);
    const productosFiltrados = productos.filter(p => p.stock >= minimo);
    mostrarProductos(productosFiltrados);
  });
}
