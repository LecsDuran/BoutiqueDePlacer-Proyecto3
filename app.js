const API_URL = "http://127.0.0.1:8000/productos";

// Selección de Elementos del DOM
const formProducto = document.getElementById("formProducto");
const tablaProductos = document.getElementById("tablaProductos");
const totalProductos = document.getElementById("totalProductos");


 // Contenedor donde mostraremos las tarjetas de los productos
const catalogoVisual = document.getElementById("catalogoVisual");


// 1. Función para Cargar Productos (GET)
async function cargarProductos() {
    try {
        const respuesta = await fetch(API_URL);
        const productos = await respuesta.json();

        tablaProductos.innerHTML = "";

        // Limpiamos las tarjetas anteriores antes de actualizar el catálogo
        catalogoVisual.innerHTML = "";

        totalProductos.textContent = `${productos.length} productos`;

        if (productos.length === 0) {
            tablaProductos.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted py-4">
                        No hay productos registrados en la tiendita.
                    </td>
                </tr>`;
            return;
        }

        

        productos.forEach(p => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td class="fw-bold text-secondary">#${p.id}</td>
                <td>${p.nombre}</td>
                <td class="text-success fw-bold">$${p.precio}</td>
                <td>
                    <span class="badge ${p.cantidad < 10 ? 'bg-danger' : 'bg-success'}">
                        ${p.cantidad} unidades
                    </span>
                </td>
                <td class="text-end">

                     <!-- Comprar una unidad del producto -->
                    <button class="btn btn-outline-primary btn-sm"
                            onclick="comprarProducto(${p.id})">
                        <i class="bi bi-cart"></i> Comprar
                    </button>

                    <!-- Editar la información del producto -->
                    <button class="btn btn-outline-secondary btn-sm"
                            onclick="editarProducto(${p.id})">
                        <i class="bi bi-pencil-square"></i> Editar
                    </button>

                    <!-- Eliminar el producto -->
                    <button class="btn btn-outline-danger btn-sm"
                            onclick="eliminarProducto(${p.id})">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>

                </td>
            `;
            tablaProductos.appendChild(fila);

            // Agregamos también el producto al catálogo visual
            catalogoVisual.appendChild(crearTarjetaProducto(p));
        });

    } catch (error) {
        console.error("Error al cargar productos:", error);
    }
}


 // Creamos una tarjeta visual con los datos de cada producto
function crearTarjetaProducto(producto) {

    // Contenedor de la tarjeta
    const columna = document.createElement("div");
    columna.className = "col";

    const tarjeta = document.createElement("div");
    tarjeta.className = "card tarjeta-producto h-100";

    // Espacio para la fotografía
    const zonaImagen = document.createElement("div");
    zonaImagen.className = "zona-imagen";

    // Texto de respaldo si todavía no tenemos fotografía
    const respaldo = document.createElement("div");
    respaldo.className = "imagen-respaldo";
    respaldo.textContent = "Boutique de Placer";
    zonaImagen.appendChild(respaldo);

    // Cargamos la imagen usando la ruta del CSV
    if (producto.imagen) {
        const imagen = document.createElement("img");
        imagen.className = "imagen-producto";
        imagen.alt = producto.nombre;
        imagen.src = producto.imagen;

        imagen.onload = () => {
            respaldo.style.display = "none";
        };

        imagen.onerror = () => {
            imagen.style.display = "none";
        };

        zonaImagen.appendChild(imagen);
    }

    // Información de la tarjeta
    const contenido = document.createElement("div");
    contenido.className = "card-body d-flex flex-column";

    const nombre = document.createElement("h3");
    nombre.className = "nombre-producto";
    nombre.textContent = producto.nombre;

    const precio = document.createElement("p");
    precio.className = "precio-producto";
    precio.textContent = `$${Number(producto.precio).toFixed(2)} MXN`;

    const stock = document.createElement("p");
    stock.className = "stock-producto";
    stock.textContent = `${producto.cantidad} unidades disponibles`;

    // Botón conectado con nuestra función de compra
    const boton = document.createElement("button");
    boton.className = "btn btn-comprar mt-auto";
    boton.textContent = producto.cantidad > 0 ? "Comprar" : "Agotado";
    boton.disabled = producto.cantidad <= 0;

    boton.addEventListener("click", () => {
        comprarProducto(producto.id);
    });

    // Unimos los elementos de la tarjeta
    contenido.append(nombre, precio, stock, boton);
    tarjeta.append(zonaImagen, contenido);
    columna.appendChild(tarjeta);

    return columna;
}

async function agregarProducto(event){
    event.preventDefault();

    var nombre = document.getElementById("nombre").value
    var precio = Number(document.getElementById("precio").value)
    var cantidad = Number(document.getElementById("cantidad").value)
    var imagen = document.getElementById("imagen").value.trim();

    const nuevoContenido = {nombre, precio, cantidad, imagen};
    try {
        const respuesta = await fetch(API_URL, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(nuevoContenido)});

        if(respuesta.ok){
            formProducto.reset();
            await cargarProductos();
        }else{
            console.error("Hubo algo malo al guardar")
        }
    } catch (error) {
        console.log(error)
    }
}



 // ===== EDITAR PRODUCTOS =====

// Modificamos los datos de un producto existente
async function editarProducto(id_producto) {
    try {
        // Consultamos la información actual del producto
        const respuesta = await fetch(`${API_URL}/${id_producto}`);

        if (!respuesta.ok) {
            throw new Error("No se pudo consultar el producto");
        }

        const producto = await respuesta.json();

        // Solicitamos los nuevos valores, mostrando los actuales
        const nombre = prompt("Nombre del producto:", producto.nombre);
        if (nombre === null) return;

        const precio = prompt("Precio del producto:", producto.precio);
        if (precio === null) return;

        const cantidad = prompt("Cantidad disponible:", producto.cantidad);
        if (cantidad === null) return;

        const imagen = prompt(
            "Ruta de la imagen:",
            producto.imagen || ""
        );
        if (imagen === null) return;

        // Preparamos los datos para FastAPI
        const datosActualizados = {
            nombre: nombre.trim(),
            precio: Number(precio),
            cantidad: Number(cantidad),
            imagen: imagen.trim()
        };

        // Enviamos los cambios mediante PUT
        const actualizacion = await fetch(`${API_URL}/${id_producto}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datosActualizados)
        });

        if (!actualizacion.ok) {
            const error = await actualizacion.json();
            alert(JSON.stringify(error.detail || "No se pudo actualizar"));
            return;
        }

        // Refrescamos el catálogo y la tabla
        await cargarProductos();

    } catch (error) {
        console.error("Error al editar producto:", error);
    }
}


async function eliminarProducto(id_producto){

    try {
        const respuesta = await fetch("http://127.0.0.1:8000/productos/"+id_producto, {method: "DELETE", headers: {"Content-Type": "application/json"}});

        if(respuesta.ok){
            await cargarProductos();
        }else{
            console.error("Hubo algo malo al eliminar")
        }
    } catch (error) {
        console.log(error)
    }
}

// POST: Comprar una unidad de un producto
async function comprarProducto(id_producto) {

    // Intentamos enviar la solicitud de compra a FastAPI
    try {
        const respuesta = await fetch(
            `${API_URL}/${id_producto}`,
            { method: "POST" }
        );

        // Si la compra fue exitosa, actualizamos el inventario
        if (respuesta.ok) {
            await cargarProductos();
            await cargarIndicadores();
            await cargarGraficaProductos();
            await cargarGraficaFechas();

        } else {
            // Si ocurre un error, mostramos el mensaje de FastAPI
            const error = await respuesta.json();
            alert(error.detail || "No se pudo realizar la compra");
        }

    } catch (error) {
        // Mostramos en consola los errores de comunicación
        console.error("Error al comprar producto:", error);
    }
}



 // ===== DASHBOARD: INDICADORES KPI =====

// Consultamos las estadísticas calculadas por Pandas
async function cargarIndicadores() {
    try {
        // Solicitamos el resumen de ventas a FastAPI
        const respuesta = await fetch(
            "http://127.0.0.1:8000/estadisticas/resumen"
        );

        if (!respuesta.ok) {
            throw new Error("No se pudieron obtener las estadísticas");
        }

        // Convertimos la respuesta JSON en un objeto de JavaScript
        const datos = await respuesta.json();

        // Mostramos los resultados en las tarjetas del dashboard
        document.getElementById("kpiIngresos").textContent =
            `$${Number(datos.ingresos_totales).toFixed(2)} MXN`;

        document.getElementById("kpiUnidades").textContent =
            datos.unidades_vendidas;

        document.getElementById("kpiVentas").textContent =
            datos.numero_ventas;

    } catch (error) {
        console.error("Error al cargar los indicadores:", error);
    }
}



 // ===== DASHBOARD: GRÁFICA DE PRODUCTOS =====

// Guardamos la gráfica para poder actualizarla sin duplicarla
let graficaProductos = null;

// Mostramos las unidades vendidas de cada producto
async function cargarGraficaProductos() {
    try {
        // Consultamos las estadísticas calculadas por Pandas
        const respuesta = await fetch(
            "http://127.0.0.1:8000/estadisticas/productos"
        );

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar las ventas por producto");
        }

        const datos = await respuesta.json();

        // Preparamos los nombres y las cantidades
        const nombres = datos.map(p => p.producto);
        const cantidades = datos.map(p => p.unidades_vendidas);

        // Obtenemos el área de dibujo del HTML
        const canvas = document.getElementById("graficaProductos");

        // Eliminamos la gráfica anterior si ya existe
        if (graficaProductos) {
            graficaProductos.destroy();
        }

        // Creamos la gráfica de barras
        graficaProductos = new Chart(canvas, {
            type: "bar",
            data: {
                labels: nombres,
                datasets: [{
                    label: "Unidades vendidas",
                    data: cantidades,
                    backgroundColor: [
                        "rgba(173, 216, 230, 0.85)",
                        "rgba(191, 215, 234, 0.85)",
                        "rgba(166, 201, 226, 0.85)",
                        "rgba(144, 190, 227, 0.85)",
                        "rgba(173, 216, 230, 0.85)",
                        "rgba(191, 215, 234, 0.85)"
                    ],
                    borderColor: "#7FA7D8",
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error al cargar la gráfica de productos:", error);
    }
}


 // ===== DASHBOARD: GRÁFICA DE INGRESOS POR DÍA =====

// Conservamos la gráfica para actualizarla sin duplicarla
let graficaFechas = null;

// Consultamos y mostramos los ingresos diarios
async function cargarGraficaFechas() {
    try {
        // Obtenemos los datos procesados por Pandas
        const respuesta = await fetch(
            "http://127.0.0.1:8000/estadisticas/fechas"
        );

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los ingresos por fecha");
        }

        const datos = await respuesta.json();

        // Separamos las fechas y los ingresos
        const fechas = datos.map(venta => venta.dia);
        const ingresos = datos.map(venta => venta.ingresos);

        // Identificamos el canvas donde dibujaremos la gráfica
        const canvas = document.getElementById("graficaFechas");

        // Eliminamos la gráfica anterior si ya existe
        if (graficaFechas) {
            graficaFechas.destroy();
        }

        // Creamos la gráfica de líneas
        graficaFechas = new Chart(canvas, {
            type: "line",
            data: {
                labels: fechas,
                datasets: [{
                    label: "Ingresos diarios (MXN)",
                    data: ingresos,
                    borderColor: "#7FA7D8",
                    backgroundColor: "rgba(173, 216, 230, 0.30)",
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: "#A9C7E8",
                    pointBorderColor: "#7FA7D8",
                    pointRadius: 5 
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: valor => "$" + valor
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error al cargar la gráfica de ingresos:", error);
    }
}



 // Cargar el catálogo y el dashboard al abrir la página
document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    cargarIndicadores();
    cargarGraficaProductos();
    cargarGraficaFechas();
});


// Agregamos el evento para que se abre la función al dar clic en guardar producto
formProducto.addEventListener("submit", agregarProducto);
