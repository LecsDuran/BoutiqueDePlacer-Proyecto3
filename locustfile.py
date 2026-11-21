# Importamos las herramientas necesarias de Locust
from locust import HttpUser, task, between


# Definimos el comportamiento de los usuarios virtuales
class UsuarioTiendita(HttpUser):

    # Cada usuario espera entre 0.1 y 0.3 segundos entre tareas
    wait_time = between(0.1, 0.3)

    # Tarea: Simular compras del Café con mayor frecuencia
    @task(3)
    def comprar_producto(self):

        # Enviamos la compra y revisamos la respuesta HTTP
        with self.client.post("/productos/3", catch_response=True) as respuesta:

            # La compra fue realizada correctamente
            if respuesta.status_code == 200:
                respuesta.success()

            # El rechazo por falta de stock es esperado
            elif respuesta.status_code == 400 and "No hay stock disponible" in respuesta.text:
                respuesta.success()

            # Registramos cualquier otra respuesta como un fallo
            else:
                respuesta.failure(
                    f"Respuesta inesperada: HTTP {respuesta.status_code}"
                )

    # Tarea: Consultar la página principal de nuestra API
    @task(1)
    def consultar_inicio(self):

        # Enviamos una solicitud GET para verificar la respuesta
        self.client.get("/")

    # Tarea: Consultar el inventario completo de la Tiendita
    @task(2)
    def consultar_productos(self):

        # Enviamos una solicitud GET para obtener todos los productos
        self.client.get("/productos")