from faker import Faker
import mysql.connector
import random
from datetime import date, datetime
#colores para que el código sea más fácil de leer
class bcolors:
    HEADER = '\033[95m' # Púrpura *
    OKBLUE = '\033[94m'# Azul ligeramente más oscuro *
    OKCYAN = '\033[96m' # Azul *
    OKGREEN = '\033[92m' # Verde azul *
    WARNING = '\033[93m' # Amarillo brillante *
    FAIL = '\033[91m'# Rojo
    BOLD = '\033[1m' # Negritas
    UNDERLINE = '\033[4m' # Subrayar texto
    ENDC = '\033[0m' # Terminar bcolors (???????)
    WHITE = '\033[37m' # Blanco * 
#para las ecepciones
def pedir_entero(mensaje):
    while True:
        try:
            valor = int(input(mensaje))
            if valor <= 0:
                print("Ingresa un número mayor a 0.")
            else:
                return valor
        except ValueError:
            print("Solo se permiten números enteros.")

# ingreso de datos
#con excepciones para que no se caiga el programa
print(bcolors.HEADER + bcolors.BOLD + "Generador de datos falsos para MySQL" + bcolors.ENDC)
print(bcolors.OKGREEN + "Crea bases de datos y tablas con datos de prueba")
while True:
    nombre_bd = input(bcolors.BOLD + "Escribe el nombre de la base de datos: " + bcolors.ENDC).strip()
    if nombre_bd == "":
        print(bcolors.FAIL + "El nombre no puede estar vacío, intenta de nuevo." + bcolors.ENDC)
    else:
        break
while True:
    if " " in nombre_bd:
        print(bcolors.FAIL + "El nombre no puede contener espacios, intenta de nuevo." + bcolors.ENDC)
        nombre_bd = input(bcolors.BOLD + "Escribe el nombre de la base de datos: " + bcolors.ENDC).strip()
    else:
        break
num_tablas = pedir_entero(bcolors.OKBLUE + "¿Cuántas tablas deseas? " + bcolors.ENDC)
num_registros = pedir_entero(bcolors.WARNING + "¿Cuántos registros deseas generar? " + bcolors.ENDC)
coneccion = input(bcolors.HEADER + "¿Desea el archivo para carga manual o carga en servidor? (manual/servidor): " + bcolors.ENDC)

#este if sirve para separar la automatizacion del scrip de generacion estandar
if coneccion.lower() == "servidor":
    host_S = input("Escribe el host (ej: localhost): ")
    user_S = input("Escribe el usuario de la base de datos: ")
    password_S = input("Escribe la contraseña del usuario: ")
else:
    print("Se generará el archivo para carga manual")

tablas = []
estructura_tablas = {}  # diccionario para almacenar columnas de cada tabla
for i in range(num_tablas):
    nombre_tabla = input(bcolors.OKGREEN + f"Escribe el nombre de la tabla {i+1}: " + bcolors.ENDC)
    tablas.append(nombre_tabla)
    num_columnas = int(input(bcolors.OKCYAN + f"¿Cuántas columnas tendrá la tabla {nombre_tabla}? (Recomendado ≤ 4) " + bcolors.ENDC))
    columnas = []
    for j in range(num_columnas):
        nombre_col = input(bcolors.WARNING + f"Nombre de la columna {j+1} de la tabla {nombre_tabla}:\n (Ej: nombre, email, telefono, ciudad): " + bcolors.ENDC)
        tipo_col = input(bcolors.WHITE + f"Tipo de dato para {nombre_col} (ej: VARCHAR(100), INT): " + bcolors.ENDC)
        columnas.append(f"{nombre_col} {tipo_col}")
    estructura_tablas[nombre_tabla] = columnas

LIMITE_REGISTROS = 50000
if num_registros > LIMITE_REGISTROS:
    print(f"El número de registros excede el límite {LIMITE_REGISTROS}, se ajustará a este valor.")
    num_registros = LIMITE_REGISTROS
# Inicializamos faker
fake = Faker('es_MX')
Faker.seed(0)
random.seed(0)

generadores = {
    "nombre": fake.name,
    "email": fake.email,
    "telefono": fake.phone_number,
    "celular": fake.phone_number,
    "ciudad": fake.city,
    "pais": fake.country,
    "direccion": fake.address,
    "postal": fake.postcode,
    "postcode": fake.postcode,
    "ssn": fake.ssn,
    "username": fake.user_name,
    "usuario": fake.user_name,
    "compañia": fake.company,
    "empresa": fake.company,
    "trabajo": fake.job,
    "fecha": fake.date,
    "fecha_nacimiento": fake.date_of_birth,
    "color" : fake.color_name,
    "producto": fake.word,
    "lenguaje": fake.language_name,
    "idioma" : fake.language_name,
    "numero": lambda: random.randint(1, 10000),
    "tarjeta" : fake.credit_card_number,
    "precio" : lambda: round(random.uniform(10.0, 1000), 2),
    "salario" : lambda: random.randint(3000, 100000),
    "int": lambda: random.randint(1, 10000),
    "varchar": lambda: fake.word(),
    "descripcion" : lambda: fake.sentence(nb_words=6),
    "civil_estatus" : lambda: random.choice(["Soltero", "Casado", "Divorciado", "Viudo"]),
    "genero" : lambda: random.choice(["Masculino", "Femenino", "Otro"]),
    "boolean": lambda: random.choice([0, 1]),
    "id" :fake.uuid4(),
    "puesto" : fake.job,
    "empresa" : fake.company,
    "url" : fake.url,
    "ip" : fake.ipv4,
    "mac" : fake.mac_address,
    "estado" : fake.state,
    "estado_provincia" : fake.state,
    "region" : fake.state,
    "navegador" : fake.user_agent,
    "rfc" : fake.rfc,
    "cvv" : fake.credit_card_security_code,
    "marca" : lambda: random.choice(["Toyota", "Ford", "Chevrolet", "Honda", "Nissan"]),
    "modelo" : lambda: random.choice(["Sedan", "SUV", "Hatchback", "Convertible", "Truck"]),
    "año" : lambda: random.randint(1990, 2023),
    "color_auto" : fake.color_name,
    "color_vehiculo" : fake.color_name,
    "curso" : lambda: random.choice(["Matemáticas", "Historia", "Ciencia", "Literatura", "Arte"]),
    "calificacion" : lambda: random.choice(["A", "B", "C", "D", "F"]),
    "nacionalidad" : fake.country,
    "religion" : lambda: random.choice(["Católica", "Protestante", "Musulmana", "Judía", "Hindú", "Budista", "Atea"]),
    "estado_civil" : lambda: random.choice(["Soltero", "Casado", "Divorciado", "Viudo"]),
    "hobby" : lambda: random.choice(["Leer", "Viajar", "Cocinar", "Deportes", "Música", "Jardinería"]),
    "aficion" : lambda: random.choice(["Leer", "Viajar", "Cocinar", "Deportes", "Música", "Jardinería"]),
    "mascota" : lambda: random.choice(["Perro", "Gato", "Pájaro", "Pez", "Hamster"]),
    "animal" : lambda: random.choice(["Perro", "Gato", "Pájaro", "Pez", "Hamster"]),
    "fruta" : lambda: random.choice(["Manzana", "Banana", "Naranja", "Uva", "Fresa"]),
    "verdura" : lambda: random.choice(["Lechuga", "Tomate", "Zanahoria", "Pepino", "Cebolla"]),
    "bebida" : lambda: random.choice(["Agua", "Jugo", "Refresco", "Café", "Té"]),
    "musica" : lambda: random.choice(["Rock", "Pop", "Jazz", "Clásica", "Hip-Hop"]),
    "deporte" : lambda: random.choice(["Fútbol", "Baloncesto", "Tenis", "Natación", "Ciclismo"]),
    "marca_ropa" : lambda: random.choice(["Nike", "Adidas", "Puma", "Reebok", "Under Armour"]),
    "talla_ropa" : lambda: random.choice(["S", "M", "L", "XL", "XXL"]),
    "tipo_sangre" : lambda: random.choice(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
    "alergia" : lambda: random.choice(["Polen", "Polvo", "Pelos de animales", "Alimentos", "Medicamentos"]),
    "medicamento" : lambda: random.choice(["Paracetamol", "Ibuprofeno", "Amoxicilina", "Loratadina", "Omeprazol"]),
    "enfermedad" : lambda: random.choice(["Diabetes", "Hipertensión", "Asma", "Alergias", "Artritis"]), 
    "hospital" : fake.company,
    "clinica" : fake.company,
    "universidad" : fake.company,
    "escuela" : fake.company,
    "instituto" : fake.company,
    "titulo" : lambda: random.choice(["Licenciatura", "Maestría", "Doctorado", "Diplomado", "Certificación"]),
    "grado" : lambda: random.choice(["Licenciatura", "Maestría", "Doctorado", "Diplomado", "Certificación"]),
    "idioma" : fake.language_name,
    "calle" : fake.street_name,
    "avenida" : fake.street_name,
    "barrio" : fake.city_suffix,
    "colonia" : fake.city_suffix,
    "municipio" : fake.city,
    "codigo_postal" : fake.postcode,
    "numero_ext" : lambda: str(random.randint(1, 9999)),
    "numero_int" : lambda: str(random.randint(1, 9999)),
    "referencia" : fake.sentence,
    "notas" : fake.text,
    "comentarios" : fake.text,
    "observaciones" : fake.text,
    "biografia" : fake.text,
    "correo_corporativo" : fake.company_email,
    "correo_personal" : fake.email,
    "pagina_web" : fake.url,
    "sitio_web" : fake.url,
    "red_social" : lambda: random.choice(["Facebook", "Twitter", "Instagram", "LinkedIn", "TikTok"]),
    "usuario_red" : fake.user_name,
    "contrasena" : fake.password,
    "password" : fake.password,
    "moneda" : lambda: random.choice(["USD", "EUR", "MXN", "GBP", "JPY"]),
    "cantidad" : lambda: round(random.uniform(1.0, 1000.0), 2),
    "precio" : lambda: round(random.uniform(10.0, 1000.0), 2),
    "descuento" : lambda: round(random.uniform(0.0, 100.0), 2),
    "total" : lambda: round(random.uniform(10.0, 10000.0), 2),
    "iva" : lambda: round(random.uniform(0.0, 100.0), 2),
    "subtotal" : lambda: round(random.uniform(10.0, 10000.0), 2),
    "factura" : fake.bothify(text='????-########'),
    "orden" : fake.bothify(text='ORD-########'),
    "pedido" : fake.bothify(text='PED-########'),
    "producto" : fake.word,
    "servicio" : fake.word,
    "categoria" : lambda: random.choice(["Electrónica", "Ropa", "Hogar", "Juguetes", "Libros"]),
    "marca_producto" : lambda: random.choice(["Sony", "Samsung", "Apple", "LG", "Dell"]),
    "modelo_producto" : lambda: random.choice(["X100", "ProMax", "Ultra", "S20", "Note"]),
    "color_producto" : fake.color_name,
    "talla_producto" : lambda: random.choice(["S", "M", "L", "XL", "XXL"]),
    "peso" : lambda: round(random.uniform(0.1, 100.0), 2),
    "altura" : lambda: round(random.uniform(0.1, 3.0), 2),
    "ancho" : lambda: round(random.uniform(0.1, 3.0), 2),
    "largo" : lambda: round(random.uniform(0.1, 3.0), 2),
    "volumen" : lambda: round(random.uniform(0.1, 100.0), 2),
    "capacidad" : lambda: round(random.uniform(1.0, 1000.0), 2),
    "stock" : lambda: random.randint(0, 1000),
    "inventario" : lambda: random.randint(0, 1000),
    "iban" : fake.iban,
    "swift" : fake.swift,
    "ipv6" : fake.ipv6,
    "Metodo_pago" : lambda: random.choice(["Efectivo", "Tarjeta de crédito", "Tarjeta de débito", "Transferencia bancaria", "PayPal"]),
    "estatus" : lambda: random.choice(["Activo", "Inactivo", "Pendiente", "Completado", "Cancelado"]),
    "estado_pedido" : lambda: random.choice(["Activo", "Inactivo", "Pendiente", "Completado", "Cancelado"]),
    "prioridad" : lambda: random.choice(["Baja", "Media", "Alta"]),
    "nivel" : lambda: random.choice(["Básico", "Intermedio", "Avanzado"]),
    "placa_auto" : fake.license_plate,
    "placa_vehiculo" : fake.license_plate,
    "motor" : lambda: random.choice(["V6", "V8", "I4", "Electric", "Hybrid"]),
    "pais_origen" : fake.country,
    "pais_destino" : fake.country,
    "puerto" : fake.city,
    "aeropuerto" : fake.city,
    "terminal" : fake.city,
    "vuelo" : fake.bothify(text='??####'),
    "asiento" : fake.bothify(text='?#'),
    "clase" : lambda: random.choice(["Económica", "Business", "Primera"]),
    "hotel": lambda: fake.company() + " Hotel",
    "habitacion": lambda: random.randint(100, 999),
    "noches" : lambda: random.randint(1,30),
    "pasaporte" : fake.bothify(text='??######'),
    "visa" : fake.bothify(text='##########'),
    "licencia" : fake.bothify(text='##########'),
    "certificado" : fake.bothify(text='##########'),
    "numero_seguridad_social" : fake.ssn,
    "numero_seguro_social" : fake.ssn,
    "afiliacion" : fake.bothify(text='##########'),
    "peso_kg" : lambda: round(random.uniform(30.0, 200.0), 2),
    "altura_cm" : lambda: round(random.uniform(100.0, 250.0), 2),
    "imc" : lambda: round(random.uniform(15.0, 40.0), 2),
    "frecuencia_cardiaca" : lambda: random.randint(60, 100),
    "presion_arterial" : lambda: f"{random.randint(90, 140)}/{random.randint(60, 90)}",
    "temperatura" : lambda: round(random.uniform(36.0, 39.0), 1),
    "oxigenacion" : lambda: random.randint(90, 100),
    "glucosa" : lambda: random.randint(70, 140),
    "colesterol" : lambda: random.randint(150, 250),
    "trigliceridos" : lambda: random.randint(50, 200),
    "juego" : fake.word() + " Game",
    "consola" : lambda: random.choice(["PlayStation", "Xbox", "Nintendo Switch", "PC"]),
    "plataforma_juego" : lambda: random.choice(["Steam", "Epic Games", "Origin", "Uplay"]),
    "genero_juego" : lambda: random.choice(["Acción", "Aventura", "RPG", "Estrategia", "Deportes"]),
    "nickname" : fake.user_name,
    "voltaje": lambda: random.randint(1, 480),
    "gamer_tag" : fake.user_name,
    }
def safe_call_generador(func):
    try:
        if func is None:
            return None
        return func()
    except Exception:
        return None

def sql_literal(value, tipo_col):
    if value is None:
        return "NULL"
    t = tipo_col.lower()
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, (date, datetime)):
        return f"'{value.strftime('%Y-%m-%d')}'"
    if "int" in t or "decimal" in t or "float" in t or "double" in t or "numeric" in t:
        return str(value)
    s = str(value)
    s = s.replace("'", "''")  # Escapar comillas simples para SQL
    return f"'{s}'"

def generar_valor_raw(nombre_col, tipo_col):
    name = nombre_col.lower()
    t = tipo_col.lower()
    # Números enteros
    if "int" in t or "integer" in t or "bigint" in t or "smallint" in t or "tinyint" in t:
        return random.randint(1, 10000)
    # Números con decimales
    if "float" in t or "double" in t or "decimal" in t or "numeric" in t or "real" in t:
        return round(random.uniform(1.0, 10000.0), 2)
    # Fechas
    if "date" in t or "time" in t or "timestamp" in t:
        if "nacimiento" in name or "birth" in name or "cumpl" in name:
            dob = safe_call_generador(generadores.get("fecha_nacimiento"))
            if dob:
                return dob
        d = safe_call_generador(generadores.get("fecha"))
        return d
    # Intentar usar generadores por palabra clave
    for clave, func in generadores.items():
        if clave in name:
            val = safe_call_generador(func)
            if val is not None:
                return val
    # Por defecto, generar palabra corta
    return fake.word()
# escapador de identificadores con espacios (esto no se usa pero por si acaso)
def Identificador_S(name):
    return "`" + str(name).replace("`", "``") + "`"


# Generar script SQL inicial para base y tablas
sql_script = f"""
CREATE DATABASE IF NOT EXISTS {nombre_bd};
USE {nombre_bd};
"""

for nombre_tabla, columnas in estructura_tablas.items():
    estructura_columnas = ",\n    ".join(columnas)
    sql_script += f"""
CREATE TABLE IF NOT EXISTS {nombre_tabla} (
    id INT AUTO_INCREMENT PRIMARY KEY,
    {estructura_columnas}
);
"""

# Generar datos e inserts para cada tabla
for nombre_tabla, columnas in estructura_tablas.items():
    columnas_nombres = ",".join([col.split()[0] for col in columnas])
    for _ in range(num_registros):
        valores_raw = [generar_valor_raw(col.split()[0], col.split()[1]) for col in columnas]
        valores_sql = [sql_literal(val, col.split()[1]) for val, col in zip(valores_raw, columnas)]
        sql_script += f"INSERT INTO {nombre_tabla}({columnas_nombres}) VALUES ({','.join(valores_sql)});\n"

# Guardar script en archivo .sql
with open("script_generado.sql", "w", encoding="utf-8") as archivo:
    archivo.write(sql_script)

print(bcolors.OKGREEN+"\nScript SQL generado con éxito en 'script_generado.sql'"+ bcolors.ENDC)
print(bcolors.WHITE+"------ Vista previa ------")
print(sql_script[:700], bcolors.BOLD+"...\n------ Fin de la vista previa ------\n------ EL RESTO ESTÁ EN WORKBENCH ------\n"+ bcolors.ENDC)

if coneccion.lower() == "servidor":
    try:
        conexion = mysql.connector.connect(
            host=host_S,
            user=user_S,
            password=password_S,
            database=nombre_bd
        )
        cursor = conexion.cursor()
        print(bcolors.OKGREEN+"Conexión exitosa :D"+ bcolors.ENDC)
        print(bcolors.BOLD+"Creando base de datos y tablas..."+ bcolors.ENDC)
        for query in sql_script.split(';'):
            query = query.strip()
            if query:
                cursor.execute(query)
        conexion.commit()

        print(bcolors.HEADER+"Insertando datos ... esto puede tardar un poco dependiendo de la cantidad de datos..."+ bcolors.ENDC)
        print(bcolors.BOLD+"No cierres el programa"+ bcolors.ENDC)

        # Ejecución de los inserts (solo la parte INSERT)
        inserts = [line for line in sql_script.split('\n') if line.strip().upper().startswith("INSERT INTO")]
        total_inserts = len(inserts)
        for i, insert in enumerate(inserts, 1):
            cursor.execute(insert)
            if i % 1000 == 0:
                conexion.commit()
                print(bcolors.BOLD+f"{i} de {total_inserts} registros insertados..."+ bcolors.ENDC)
        conexion.commit()
        print(bcolors.OKGREEN+"Datos insertados correctamente."+ bcolors.ENDC)
        cursor.close()
        conexion.close()
    except Exception as e:
        print(bcolors.WARNING+"Error al conectar o insertar en la base de datos:"+ bcolors.ENDC, e)
        