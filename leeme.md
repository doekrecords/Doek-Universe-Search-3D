# Sistema de Búsqueda Universal v1.5

## Descripción
Sistema de visualización 3D que transforma resultados de búsqueda en un universo interactivo navegable. Cada resultado se representa como un planeta único con características visuales distintivas.

## Características Principales
- 🌍 Planetas generados proceduralmente
- 🎯 Navegación intuitiva entre resultados
- ✨ Efectos visuales y partículas dinámicas
- 📱 Soporte para interacción táctil y mouse
- 🔍 Integración con motor de búsqueda

## Tecnologías
- THREE.js para renderizado 3D
- JavaScript ES6+
- WebGL 2.0
- HTML5/CSS3

## Controles
- **Flechas**: Navegar entre planetas
- **Mouse**: 
  - Click izquierdo + arrastrar: Rotar vista
  - Click derecho + arrastrar: Pan
  - Rueda: Zoom
- **Q/E**: Rotación de cámara
- **Click en planeta**: Abrir resultado

## Estructura del Proyecto
```
├── js/
│   ├── core/
│   │   ├── init.js         # Inicialización THREE.js
│   │   └── controls.js     # Sistema de controles
│   ├── universe/
│   │   └── celestial.js    # Gestión de objetos celestes
│   └── search/
│       └── duckduckgo.js   # Integración búsqueda
├── css/
│   └── styles.css          # Estilos globales
├── index.html              # Punto de entrada
├── DOCUMENTATION.md        # Documentación detallada
└── CHANGELOG.md           # Registro de cambios
```

## Documentación
- [Documentación Completa](DOCUMENTATION.md)
- [Registro de Cambios](CHANGELOG.md)

## Rendimiento
- Optimizado para navegadores modernos
- Gestión eficiente de memoria
- Limpieza automática de recursos

## Estado Actual
Versión 1.5 estable con mejoras significativas en:
- Sistema de títulos flotantes
- Navegación y controles de cámara
- Gestión de memoria y recursos
- Efectos visuales y rendimiento

## Requisitos del Sistema
- Navegador con soporte WebGL 2.0
- Hardware con aceleración gráfica
- Conexión a internet para búsquedas

## Instalación
1. Clonar el repositorio
2. Servir los archivos desde un servidor web como XAMPP
3. Acceder a través del navegador

## Uso
1. Ingresar término de búsqueda
2. Navegar entre resultados usando controles
3. Interactuar con planetas para más información
4. Click en planeta para acceder al resultado
---

*Sistema de Búsqueda Universal - Versión 1.5 Estable*

Founder : Kevin Adrian Díaz Farías (Doek Universe)
Colaboradores :
