import requests
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from faker import Faker

# 🔧 CONFIGURACIÓN
BASE_URL = "https://TU-TUNEL.cloudflare.com"  # 👈 CAMBIA ESTO
ENDPOINT = "/api/usuarios/registro"
TOTAL_REQUESTS = 100
MAX_WORKERS = 20  # hilos concurrentes

fake = Faker()

def crear_usuario(i):
    payload = {
        "nombre": fake.name(),
        "email": fake.email(),
        "password": "password123"
    }

    start_time = time.time()

    try:
        response = requests.post(
            f"{BASE_URL}{ENDPOINT}",
            json=payload,
            timeout=5
        )

        elapsed = (time.time() - start_time) * 1000  # ms

        return {
            "status": response.status_code,
            "time": elapsed
        }

    except requests.exceptions.RequestException as e:
        return {
            "status": "ERROR",
            "time": 0,
            "error": str(e)
        }

#test de estrés para el endpoint de registro de usuarios
# antes de cambio a instancia en la nube, se recomienda ejecutar este test para verificar que el servidor puede manejar la carga esperada
# Si el servidor empieza a fallar bajo carga, es una señal de que necesitas escalar tu infraestructura o optimizar tu código antes de lanzar a producción.
def stress_test():
    print(f"🚀 Enviando {TOTAL_REQUESTS} requests con {MAX_WORKERS} hilos...\n")

    resultados = []
    inicio = time.time()

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(crear_usuario, i) for i in range(TOTAL_REQUESTS)]

        for future in as_completed(futures):
            resultado = future.result()
            resultados.append(resultado)

            if resultado["status"] == 200:
                print(f"✅ 200 OK | {resultado['time']:.2f} ms")
            elif resultado["status"] == "ERROR":
                print(f"❌ ERROR | {resultado.get('error')}")
            else:
                print(f"⚠️ {resultado['status']} | {resultado['time']:.2f} ms")

    fin = time.time()

    # 📊 Métricas finales
    total_time = fin - inicio
    rps = TOTAL_REQUESTS / total_time

    print("\n📊 RESULTADOS:")
    print(f"⏱ Tiempo total: {total_time:.2f}s")
    print(f"⚡ Requests por segundo (RPS): {rps:.2f}")

    errores = [r for r in resultados if r["status"] != 200]
    print(f"❌ Errores: {len(errores)}")

    if errores:
        print("⚠️ El servidor empezó a fallar bajo carga")


if __name__ == "__main__":
    stress_test()