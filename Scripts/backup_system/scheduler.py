import time
from backup_db import backup_db

while True:
    backup_db()
    time.sleep(3600) 