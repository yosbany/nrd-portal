# NRD Portal

Portal principal del sistema NRD que proporciona acceso a todas las aplicaciones del sistema.

## Características

- Acceso centralizado a todas las aplicaciones NRD
- Autenticación unificada
- Navegación entre módulos

## Estructura

```
nrd-portal/
├── index.html          # Punto de entrada
├── app.js              # Controlador principal
├── service-worker.js   # Service Worker para PWA
├── manifest.json       # Configuración PWA
├── assets/            # Recursos estáticos
│   ├── icons/         # Iconos de la aplicación
│   └── styles/        # Estilos CSS
├── views/             # Vistas de la aplicación
│   └── portal/        # Vista principal del portal
└── tools/             # Herramientas de desarrollo
    ├── generate-icons/ # Generador de iconos
    ├── nrd-portal-server/ # Servidor local
    └── update-version/    # Actualizador de versión
```

## Desarrollo Local

Para ejecutar el servidor local de desarrollo:

```bash
./tools/nrd-portal-server/server.sh
```

La aplicación estará disponible en `http://localhost:8006/nrd-portal/`

## Despliegue

Este proyecto se despliega en GitHub Pages. Los cambios se reflejan automáticamente después de hacer push a la rama `main`.
