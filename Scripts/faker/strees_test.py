import sys
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from faker import Faker

# CONFIG
BASE_URL = "https://SEXO.cloudflare.com"  #cambia esta jairo
#que riko el jairo perro
ENDPOINT = "/api/usuarios/registro"

TOTAL_REQUESTS = 100
MAX_WORKERS = 20
TIMEOUT = 8
MAX_CONSECUTIVE_FAILURES = 5

fake = Faker()
fake.seed_instance(42)  # para reproducibilidad

# -------------------------------
# PETICIÓN
# -------------------------------
def crear_usuario():
    payload = {
        "nombre": fake.name(),
        "email": fake.email(),
        "password": "password123"
    }

    start = time.time()

    try:
        response = requests.post(
            f"{BASE_URL}{ENDPOINT}",
            json=payload,
            timeout=TIMEOUT
        )

        elapsed = (time.time() - start) * 1000

        # Éxito
        if response.status_code == 200:
            print(f"✅ 200 OK | {elapsed:.2f} ms")
            return "OK"

        # Errores del servidor
        elif response.status_code in [500, 502]:
            print(f"🔥 {response.status_code} SERVER ERROR | {elapsed:.2f} ms")
            return "SERVER_ERROR"

        else:
            print(f"⚠️ {response.status_code} | {elapsed:.2f} ms")
            return "OTHER"

    except requests.exceptions.Timeout:
        print("⏳ TIMEOUT: servidor no respondió")
        return "TIMEOUT"

    except requests.exceptions.ConnectionError:
        print("🔌 CONNECTION ERROR: servidor caído o túnel muerto")
        return "CONNECTION_ERROR"

    except Exception as e:
        print(f"❌ ERROR DESCONOCIDO: {e}")
        return "ERROR"


# -------------------------------
#  MODO DEMO 
# -------------------------------
def modo_demo():
    print("\n MODO DEMO ACTIVADO\n")

    fallos_consecutivos = 0

    for i in range(TOTAL_REQUESTS):
        resultado = crear_usuario()

        if resultado in ["TIMEOUT", "SERVER_ERROR"]:
            fallos_consecutivos += 1
        else:
            fallos_consecutivos = 0

        # 🚨 KILL SWITCH
        if fallos_consecutivos >= MAX_CONSECUTIVE_FAILURES:
            print("\n🚨 ABORTANDO: Servidor saturado. Migración a la nube requerida.")
            sys.exit()

        time.sleep(0.2)  # efecto visual


# -------------------------------
#  MODO ESTRÉS
# -------------------------------
def modo_estres():
    print("\n MODO ESTRÉS ACTIVADO\n")

    fallos_consecutivos = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(crear_usuario) for _ in range(TOTAL_REQUESTS)]

        for future in as_completed(futures):
            resultado = future.result()

            if resultado in ["TIMEOUT", "SERVER_ERROR"]:
                fallos_consecutivos += 1
            else:
                fallos_consecutivos = 0

            # KILL SWITCH
            if fallos_consecutivos >= MAX_CONSECUTIVE_FAILURES:
                print("\n ABORTANDO: Servidor saturado. Migración a la nube requerida.")
                sys.exit()


# -------------------------------
#  MENÚ
# -------------------------------
def menu():
    print("\n QA STRESS TEST - THE VAULT\n")
    print("1. Modo Demostración (visual)")
    print("2. Modo Estrés (carga real)\n")

    opcion = input("Selecciona una opción: ")

    if opcion == "1":
        modo_demo()
    elif opcion == "2":
        modo_estres()
    else:
        print("Opción inválida")


# -------------------------------
#  ENTRY POINT
# -------------------------------
if __name__ == "__main__":
    menu()