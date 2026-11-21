# Boutique de Placer — Proyecto 3

## Descripción

Boutique de Placer es una aplicación web de gestión de productos y ventas, desarrollada como parte de la materia Programación IV.

El proyecto integra una interfaz visual de tienda, una API REST construida con FastAPI, almacenamiento persistente mediante archivos CSV, análisis de datos con Pandas y gráficas dinámicas con Chart.js.

La temática seleccionada es una boutique de productos de bienestar íntimo.

## Tecnologías utilizadas

- **Python:** lenguaje principal del backend.
- **FastAPI:** desarrollo de la API REST.
- **Pydantic:** validación de los datos de productos.
- **CSV:** almacenamiento de inventario e historial de ventas.
- **Pandas:** procesamiento y análisis de ventas.
- **HTML:** estructura de la página web.
- **CSS y Bootstrap:** diseño e interfaz visual.
- **JavaScript:** interacción con la API.
- **Chart.js:** visualización de estadísticas.
- **Locust:** archivo conservado de las prácticas de pruebas de carga de la Unidad 2.

## Funcionalidades principales

### 1. Gestión de inventario

La aplicación permite:

- Registrar productos nuevos.
- Consultar el catálogo y sus existencias.
- Modificar los datos de productos existentes.
- Eliminar productos.
- Guardar los cambios en `productos.csv`.

Cada producto contiene un identificador, nombre, precio, cantidad disponible y ruta de imagen.

### 2. Registro de compras

La tienda permite comprar una unidad de un producto disponible.

Cuando se realiza una compra:

1. FastAPI identifica el producto.
2. Comprueba que haya existencias.
3. Descuenta una unidad del inventario.
4. Actualiza `productos.csv`.
5. Registra la transacción en `ventas.csv`.

### 3. Dashboard de ventas

El dashboard presenta tres indicadores:

- Ingresos totales.
- Unidades vendidas.
- Número de ventas realizadas.

También incluye dos gráficas dinámicas:

- **Productos más vendidos:** compara las unidades vendidas por producto.
- **Ingresos por día:** muestra los ingresos agrupados por fecha.

Las estadísticas se calculan utilizando Pandas a partir del historial de ventas.

## Estructura del proyecto

```text
BoutiqueDePlacer-Proyecto3/
│
├── imagenes/
│   ├── aceite.jpg
│   ├── dildo.jpg
│   ├── lubricante.jpg
│   ├── preservativos.jpg
│   ├── vela.jpg
│   └── vibrador.jpg
│
├── .gitignore
├── app.js
├── index.html
├── locustfile.py
├── main.py
├── productos.csv
├── README.md
├── requirements.txt
├── styles.cc
└── ventas.csv
```

## Requisitos

- Python 3.11 o una versión compatible.
- Conexión a internet para cargar Bootstrap, las fuentes de Google y Chart.js desde sus respectivos CDN.
- Un navegador web.
- Las bibliotecas Python indicadas en `requirements.txt`.

## Instalación y ejecución

### Paso 1. Obtener el proyecto

Descargar el repositorio de GitHub y extraerlo, o clonarlo con Git.

### Paso 2. Abrir la carpeta

Abrir la carpeta del proyecto en Visual Studio Code.

### Paso 3. Instalar las dependencias

Abrir una terminal dentro de la carpeta del proyecto y ejecutar:

```bash
python -m pip install -r requirements.txt
```

### Paso 4. Iniciar el servidor

En la misma terminal, ejecutar:

```bash
python -m uvicorn main:app --reload
```

La API estará disponible en:

`http://127.0.0.1:8000`

La documentación interactiva de FastAPI se encuentra en:

`http://127.0.0.1:8000/docs`

### Paso 5. Abrir la tienda

Con el servidor en ejecución, abrir `index.html` en el navegador.

La tienda consultará la API local para mostrar los productos y las estadísticas.

**Importante:** mantener abierta la terminal donde se ejecuta Uvicorn mientras se utiliza la aplicación.

## Archivos de datos

### productos.csv

Contiene la información del inventario:

- ID
- Nombre
- Precio
- Cantidad
- Ruta de imagen

### ventas.csv

Almacena el historial de transacciones:

- Identificador de venta
- Fecha y hora
- Producto
- Precio
- Cantidad
- Monto total

Los archivos CSV permiten conservar los datos después de cerrar la aplicación.

El historial de ventas incluido en el proyecto contiene registros simulados con fines académicos.

## Endpoints principales

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/productos` | Consultar productos |
| GET | `/productos/{producto_id}` | Consultar un producto |
| POST | `/productos` | Registrar un producto |
| PUT