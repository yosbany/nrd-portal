#!/usr/bin/env python3
"""
Generador de iconos PNG desde SVG para NRD Portal
Convierte los archivos SVG a PNG en los tamaños requeridos
"""

import os
import sys
from pathlib import Path

def convert_svg_to_png(svg_path, png_path, size):
    """
    Convierte un archivo SVG a PNG usando cairosvg
    """
    try:
        import cairosvg
        # Usar cairosvg si está disponible
        cairosvg.svg2png(
            url=str(svg_path),
            write_to=str(png_path),
            output_width=size,
            output_height=size
        )
        print(f"✓ Generado {png_path.name} ({size}x{size})")
        return True
    except ImportError:
        print("⚠ Error: Se requiere cairosvg para convertir SVG a PNG")
        print("   Instala con: pip install cairosvg")
        print(f"   O convierte manualmente {svg_path.name} a {png_path.name} ({size}x{size})")
        print()
        print("   Alternativa: Usa una herramienta online como:")
        print("   - https://convertio.co/svg-png/")
        print("   - https://cloudconvert.com/svg-to-png")
        return False
    except Exception as e:
        print(f"✗ Error al convertir {svg_path.name}: {e}")
        return False

def main():
    # Obtener el directorio raíz del proyecto (dos niveles arriba del script)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent
    
    # Rutas de los archivos SVG
    svg_192 = project_root / "icon-192.svg"
    svg_512 = project_root / "icon-512.svg"
    
    # Verificar que existan los SVG
    if not svg_192.exists():
        print(f"✗ Error: No se encuentra {svg_192.name}")
        return 1
    
    if not svg_512.exists():
        print(f"✗ Error: No se encuentra {svg_512.name}")
        return 1
    
    print("Generando iconos PNG desde SVG...")
    print(f"Directorio: {project_root}")
    print()
    
    success = True
    
    # Convertir icon-192.svg a icon-192.png
    png_192 = project_root / "icon-192.png"
    if png_192.exists():
        print(f"ℹ {png_192.name} ya existe, omitiendo...")
    else:
        if not convert_svg_to_png(svg_192, png_192, 192):
            success = False
    
    # Convertir icon-512.svg a icon-512.png
    png_512 = project_root / "icon-512.png"
    if png_512.exists():
        print(f"ℹ {png_512.name} ya existe, omitiendo...")
    else:
        if not convert_svg_to_png(svg_512, png_512, 512):
            success = False
    
    if success:
        print()
        print("✓ Iconos generados exitosamente!")
        if png_192.exists():
            print(f"  - {png_192.name}")
        if png_512.exists():
            print(f"  - {png_512.name}")
    else:
        print()
        print("⚠ Algunos iconos no pudieron generarse. Ver mensajes arriba.")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
