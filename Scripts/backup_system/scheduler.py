import time
from backup_db import backup_db

while True:
    backup_db()
    #ZZZ UNA HORA Y SE ACTIVA DE NUEBO
    time.sleep(3600) 