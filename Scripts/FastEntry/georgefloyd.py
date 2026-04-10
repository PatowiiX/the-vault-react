import subprocess

# First program (npm start)
subprocess.Popen([
    "gnome-terminal",
    "--",
    "bash",
    "-c",
    "cd /path/to/your/project && npm start; exec bash"
])

# Second program (node server.js)
subprocess.Popen([
    "gnome-terminal",
    "--",
    "bash",
    "-c",
    "cd /path/to/your/server && node server.js; exec bash"
])