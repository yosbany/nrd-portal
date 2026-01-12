#!/bin/bash
# Generador de iconos para NRD Portal
# Uso: ./generate-icon.sh "TEXTO_DEL_ICONO"
# Ejemplo: ./generate-icon.sh "NRD PORTAL"

set -e  # Salir si hay algún error

# Verificar que se pasó un parámetro
if [ -z "$1" ]; then
    echo "✗ Error: Debes proporcionar el texto del icono como parámetro"
    echo "   Uso: ./generate-icon.sh \"TEXTO_DEL_ICONO\""
    echo "   Ejemplo: ./generate-icon.sh \"NRD PORTAL\""
    exit 1
fi

ICON_TEXT="$1"

# Obtener el directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Generando icono con texto: \"$ICON_TEXT\""
echo "Directorio del proyecto: $PROJECT_ROOT"
echo ""

# Cambiar al directorio del proyecto
cd "$PROJECT_ROOT"

# Crear entorno virtual si no existe
VENV_DIR=".venv"
if [ ! -d "$VENV_DIR" ]; then
    echo "Creando entorno virtual..."
    python3 -m venv "$VENV_DIR"
fi

# Activar entorno virtual
echo "Activando entorno virtual..."
source "$VENV_DIR/bin/activate"

# Instalar dependencias si no están instaladas
echo "Verificando dependencias..."
if ! python3 -c "import cairosvg" 2>/dev/null; then
    echo "Instalando cairosvg..."
    pip install -q cairosvg
else
    echo "✓ cairosvg ya está instalado"
fi

# Ejecutar el script Python para generar el icono
echo ""
echo "Generando iconos..."
python3 "$SCRIPT_DIR/generate-icon.py" "$ICON_TEXT"

echo ""
echo "✓ Iconos generados exitosamente!"
echo "  - icon-192.png"
echo "  - icon-512.png"

