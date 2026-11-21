# Importaciones
import asyncio
import csv
import pandas as pd
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

#Creación de la aplicación
app = FastAPI()

#Configuración del middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
# Modelo de Pydantic para validar los productos nuevos
class CrearProducto(BaseModel):
    nombre: str = Field(..., min_length=1)
    precio: float = Field(..., gt=0)
    cantidad: int = Field(..., ge=0)
    imagen: str = ""


# Creamos un candado para evitar compras simultáneas incorrectas
lock = asyncio.Lock()

# Ruta del archivo CSV dentro de la carpeta del proyecto
RUTA_PRODUCTOS = Path(__file__).resolve().parent / "productos.csv"

# Cargar el inventario desde productos.csv
def cargar_inventario_csv() -> list[dict]:
    productos = []

    # Comprobar si existe el archivo CSV
    if not RUTA_PRODUCTOS.exists():
        return productos

    # Abrir el CSV y convertir cada fila en un diccionario
    with open(RUTA_PRODUCTOS, mode="r", encoding="utf-8", newline="") as archivo:
        reader = csv.DictReader(archivo)

        for fila in reader:
            productos.append({
                "id": int(fila["id"]),
                "nombre": fila["nombre"],
                "precio": float(fila["precio"]),
                "cantidad": int(fila["cantidad"]),
                "imagen": fila.get("imagen", "")
            })
    return productos


# Guardar el inventario actualizado en productos.csv
def guardar_inventario_csv(productos: list[dict]) -> None:

    # Abrir el archivo en modo escritura
    with open(RUTA_PRODUCTOS, mode="w", encoding="utf-8", newline="") as archivo:

        # Definir las columnas del inventario
        columnas = ["id", "nombre", "precio", "cantidad", "imagen"]

        # Preparar la escritura de los diccionarios en CSV
        escritor = csv.DictWriter(archivo, fieldnames=columnas)

        # Escribir encabezados y productos
        escritor.writeheader()
        escritor.writerows(productos)


# Ruta del archivo donde guardaremos las ventas
RUTA_VENTAS = Path(__file__).resolve().parent / "ventas.csv"


# Registrar una compra en el historial de ventas
def registrar_venta_csv(producto_nombre: str, precio: float, cantidad: int = 1) -> None:

    # Consultar los registros existentes para obtener el siguiente ID
    with open(RUTA_VENTAS, mode="r", encoding="utf-8-sig", newline="") as archivo:
        ventas = list(csv.DictReader(archivo))

    nuevo_id = max((int(venta["id_venta"]) for venta in ventas), default=0) + 1

    # Obtener fecha, hora e importe de la compra
    fecha_actual = datetime.now().strftime("%Y-%m-%d %H:%M")
    monto_total = precio * cantidad

    # Agregar la nueva venta sin borrar las anteriores
    with open(RUTA_VENTAS, mode="a", encoding="utf-8", newline="") as archivo:
        escritor = csv.writer(archivo)
        escritor.writerow([
            nuevo_id, fecha_actual, producto_nombre,
            precio, cantidad, monto_total
        ])


# GET: Mostrar un mensaje de bienvenida para verificar que la API funciona
@app.get("/")
def home():
    return {"Message": "Hola bienvenido"}


# GET: Consultar el inventario desde productos.csv
@app.get("/productos")
def obtener_productos():
    return cargar_inventario_csv()


# GET: Consultar un producto por su ID desde el archivo CSV
@app.get("/productos/{producto_id}")
def getproducto(producto_id: int):

    # Cargamos el inventario actualizado
    productos = cargar_inventario_csv()

    # Buscamos el producto que coincida con el ID solicitado
    for producto in productos:
        if producto["id"] == producto_id:
            return producto

    # Si no encontramos el producto, devolvemos un error 404
    raise HTTPException(
        status_code=404,
        detail="Producto no encontrado"
    )


# POST: Comprar una unidad de un producto mediante su ID
@app.post("/productos/{producto_id}")
async def comprarProducto(producto_id: int):

    # Intentamos procesar la compra
    try:

        # Bloqueamos la operación para evitar compras simultáneas incorrectas
        async with lock:

            # Cargamos el inventario actualizado desde el CSV
            productos = cargar_inventario_csv()

            # Buscamos el producto solicitado
            for producto in productos:
                if producto["id"] == producto_id:

                    # Verificamos que haya stock disponible
                    if producto["cantidad"] > 0:

                        # Descontamos una unidad
                        producto["cantidad"] -= 1

                        # Guardamos el inventario actualizado
                        guardar_inventario_csv(productos)

                        # Registramos la venta en ventas.csv
                        registrar_venta_csv(
                            producto_nombre=producto["nombre"],
                            precio=producto["precio"],
                            cantidad=1
                        )

                        # Devolvemos la confirmación de compra
                        return {
                            "mensaje": "Compra realizada",
                            "producto": producto["nombre"],
                            "stock_restante": producto["cantidad"]
                        }

                    # Error controlado cuando no hay inventario
                    raise HTTPException(
                        status_code=400,
                        detail="No hay stock disponible"
                    )

            # Error controlado cuando no existe el producto
            raise HTTPException(
                status_code=404,
                detail="Producto no encontrado"
            )

    # Conservamos los errores HTTP que ya definimos
    except HTTPException:
        raise

    # Controlamos otros errores inesperados
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error interno al procesar la compra"
        )

# POST: Agregar un producto nuevo al inventario CSV
@app.post("/productos")
async def addProducto(producto: CrearProducto):

    # Bloqueamos la operación para evitar modificaciones simultáneas
    async with lock:

        # Cargamos el inventario actual desde productos.csv
        productos = cargar_inventario_csv()

        # Calculamos el siguiente ID disponible
        nuevo_id = max(
            (p["id"] for p in productos),
            default=0
        ) + 1

        # Creamos el producto con los datos validados por Pydantic
        nuevo_producto = {
            "id": nuevo_id,
            "nombre": producto.nombre,
            "precio": producto.precio,
            "cantidad": producto.cantidad,
            "imagen": producto.imagen
        }

        # Incorporamos el nuevo producto al inventario
        productos.append(nuevo_producto)

        # Guardamos el inventario completo en productos.csv
        guardar_inventario_csv(productos)

        # Devolvemos el producto registrado
        return nuevo_producto


# DELETE: Eliminar un producto del inventario CSV
@app.delete("/productos/{producto_id}")
async def eliminar_producto(producto_id: int):

    # Protegemos la modificación del inventario
    async with lock:

        # Leemos los productos registrados en el CSV
        productos = cargar_inventario_csv()

        # Buscamos el producto que queremos eliminar
        for producto in productos:
            if producto["id"] == producto_id:

                # Quitamos el producto de la lista
                productos.remove(producto)

                # Guardamos el inventario sin el producto eliminado
                guardar_inventario_csv(productos)

                # Confirmamos la eliminación
                return {
                    "mensaje": "Producto eliminado",
                    "producto": producto["nombre"]
                }

        # Si no existe el ID, respondemos con error 404
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )



# PUT: Actualizar los datos de un producto existente
@app.put("/productos/{producto_id}")
async def actualizar_producto(producto_id: int, datos: CrearProducto):

    # Protegemos el inventario durante la modificación
    async with lock:

        # Cargamos los productos desde el CSV
        productos = cargar_inventario_csv()

        # Buscamos el producto que queremos actualizar
        for producto in productos:
            if producto["id"] == producto_id:

                # Actualizamos sus datos con la información recibida
                producto["nombre"] = datos.nombre
                producto["precio"] = datos.precio
                producto["cantidad"] = datos.cantidad
                producto["imagen"] = datos.imagen

                # Guardamos los cambios de forma permanente
                guardar_inventario_csv(productos)

                return {
                    "mensaje": "Producto actualizado",
                    "producto": producto
                }

        # Respondemos con 404 si el producto no existe
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )


# ===== DASHBOARD: INDICADORES KPI =====

# Endpoint para calcular el resumen general de ventas
@app.get("/estadisticas/resumen")
def obtener_resumen_ventas():

    # Valores iniciales cuando todavía no existen ventas
    resumen_vacio = {
        "ingresos_totales": 0,
        "unidades_vendidas": 0,
        "numero_ventas": 0
    }

    # Comprobamos que exista el archivo de ventas
    if not RUTA_VENTAS.exists():
        return resumen_vacio

    # Leemos el historial de ventas con Pandas
    df = pd.read_csv(RUTA_VENTAS)

    # Si el archivo no tiene ventas, devolvemos ceros
    if df.empty:
        return resumen_vacio

    # Calculamos los tres indicadores
    ingresos = float(df["monto_total"].sum())
    unidades = int(df["cantidad"].sum())
    ventas = int(len(df))

    # Enviamos los resultados a JavaScript
    return {
        "ingresos_totales": round(ingresos, 2),
        "unidades_vendidas": unidades,
        "numero_ventas": ventas
    }


# Endpoint para analizar las ventas agrupadas por producto
@app.get("/estadisticas/productos")
def obtener_ventas_por_producto():

    # Comprobamos que exista el archivo de ventas
    if not RUTA_VENTAS.exists():
        return []

    # Cargamos los registros en un DataFrame
    df = pd.read_csv(RUTA_VENTAS)

    # Si todavía no existen ventas, devolvemos una lista vacía
    if df.empty:
        return []

    # Agrupamos las ventas por nombre de producto
    resumen = (
        df.groupby("producto", as_index=False)
        .agg(
            unidades_vendidas=("cantidad", "sum"),
            ingresos=("monto_total", "sum")
        )
        .sort_values("unidades_vendidas", ascending=False)
    )

    # Convertimos el resultado a una lista de diccionarios
    return resumen.to_dict(orient="records")



# Endpoint para analizar las ventas por fecha
@app.get("/estadisticas/fechas")
def obtener_ventas_por_fecha():

    # Comprobamos que exista el archivo de ventas
    if not RUTA_VENTAS.exists():
        return []

    # Leemos los registros de ventas con Pandas
    df = pd.read_csv(RUTA_VENTAS)

    # Si no existen ventas, devolvemos una lista vacía
    if df.empty:
        return []

    # Convertimos la fecha de texto a formato de fecha
    df["fecha"] = pd.to_datetime(df["fecha"])

    # Extraemos solamente el día, sin la hora
    df["dia"] = df["fecha"].dt.strftime("%Y-%m-%d")

    # Agrupamos las ventas por día y sumamos sus ingresos
    resumen = (
        df.groupby("dia", as_index=False)
        .agg(
            ingresos=("monto_total", "sum"),
            unidades_vendidas=("cantidad", "sum")
        )
        .sort_values("dia")
    )

    # Convertimos el DataFrame a una lista de diccionarios
    return resumen.to_dict(orient="records")

