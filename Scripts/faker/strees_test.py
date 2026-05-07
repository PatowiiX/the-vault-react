import sys
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from faker import Faker

# CONFIG
ENDPOINT = "https://api.thevaultretrosound.page/api/usuarios/register"  # Asegúrate de que esta URL apunte directamente a tu API

TOTAL_REQUESTS = 500
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
        "username": fake.user_name(),
        "nombre": fake.name(),
        "email": fake.email(),
        "password": "password123"
    }

    start = time.time()

    try:
        # Se corrigió la URL para golpear solo la API directamente
        response = requests.post(
            ENDPOINT,
            json=payload,
            timeout=TIMEOUT
        )

        elapsed = (time.time() - start) * 1000

        # Éxito
        if response.status_code in [200, 201]:
            print(f"✅ 200/201 OK | {elapsed:.2f} ms")
            return "OK"

        # Errores del servidor
        elif response.status_code in [500, 502]:
            print(f"🔥 {response.status_code} SERVER ERROR | {elapsed:.2f} ms")
            return "SERVER_ERROR"

        else:
            print(f"⚠️ {response.status_code} ERROR DE VALIDACION: {response.text} | {elapsed:.2f} ms")
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
    print("\n🚀 MODO DEMO ACTIVADO\n")

    fallos_consecutivos = 0
    exitos = 0

    for i in range(TOTAL_REQUESTS):
        resultado = crear_usuario()

        if resultado == "OK":
            exitos += 1
            fallos_consecutivos = 0
            
            # MILESTONE 50 USUARIOS
            if exitos == 50:
                print(f"\n{'='*60}")
                print("🔥 50 USUARIOS ALCANZADOS 🔥")
                print("¡El tráfico está fluyendo hacia AWS RDS con éxito!")
                print(f"{'='*60}\n")
                
        elif resultado in ["TIMEOUT", "SERVER_ERROR"]:
            fallos_consecutivos += 1

        # 🚨 KILL SWITCH
        if fallos_consecutivos >= MAX_CONSECUTIVE_FAILURES:
            print("\n🚨 ABORTANDO: Servidor saturado. Migración a la nube requerida.")
            sys.exit()

        time.sleep(0.2)  # efecto visual


# -------------------------------
#  MODO ESTRÉS
# -------------------------------
def modo_estres():
    print("\n🔥 MODO ESTRÉS ACTIVADO\n")

    fallos_consecutivos = 0
    exitos = 0

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(crear_usuario) for _ in range(TOTAL_REQUESTS)]

        for future in as_completed(futures):
            resultado = future.result()

            if resultado == "OK":
                exitos += 1
                fallos_consecutivos = 0
                
                # MILESTONE 50 USUARIOS
                if exitos == 50:
                    print(f"\n{'='*60}")
                    print("🔥 50 USUARIOS ALCANZADOS 🔥")
                    print("¡El tráfico está fluyendo hacia AWS RDS con éxito!")
                    print(f"{'='*60}\n")
                    
            elif resultado in ["TIMEOUT", "SERVER_ERROR"]:
                fallos_consecutivos += 1

            # KILL SWITCH
            if fallos_consecutivos >= MAX_CONSECUTIVE_FAILURES:
                print("\n🚨 ABORTANDO: Servidor saturado. Migración a la nube requerida.")
                sys.exit()


# -------------------------------
#  MENÚ
# -------------------------------
def menu():
    print("\n🛡️ QA STRESS TEST - THE VAULT\n")
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