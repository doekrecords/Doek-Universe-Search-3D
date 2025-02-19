import { THREE, scene, camera, renderer, controls, initUniverse } from './core/init.js';
import { UniverseControls } from './core/controls.js';
import { SearchManager } from './search/duckduckgo.js';

class DoekUniverse {
    constructor() {
        console.log('Initializing DoekUniverse');
        // Inicializar componentes principales
        this.searchManager = new SearchManager();
        this.universeControls = new UniverseControls();

        // Configurar raycaster para interacción
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredObject = null;

        // Inicializar eventos
        this.initializeEventListeners();
        
        // Mostrar controles de ayuda
        this.showControlsHelp();
        console.log('DoekUniverse initialized');
    }

    initializeEventListeners() {
        console.log('Setting up event listeners');
        // Eventos del mouse
        const container = document.getElementById('universe-container');
        container.addEventListener('mousemove', (e) => this.onMouseMove(e));
        container.addEventListener('click', (e) => this.onClick(e));
        
        // Eventos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'h' || e.key === 'H') {
                this.toggleControlsHelp();
            } else if (e.key === 'f' || e.key === 'F') {
                this.toggleFullscreen();
            } else if (e.key === 'r' || e.key === 'R') {
                this.resetCamera();
            }
        });
    }

    onMouseMove(event) {
        const rect = event.target.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, camera);

        const intersects = this.raycaster.intersectObjects(
            Array.from(this.searchManager.celestialManager.resultObjects.values())
        );

        if (intersects.length > 0) {
            const newHovered = intersects[0].object;
            
            if (this.hoveredObject !== newHovered) {
                if (this.hoveredObject?.userData.onHoverEnd) {
                    this.hoveredObject.userData.onHoverEnd();
                }

                if (newHovered.userData.onHover) {
                    newHovered.userData.onHover();
                }

                this.hoveredObject = newHovered;
                document.body.style.cursor = 'pointer';
            }
        } else {
            if (this.hoveredObject?.userData.onHoverEnd) {
                this.hoveredObject.userData.onHoverEnd();
            }
            this.hoveredObject = null;
            document.body.style.cursor = 'default';
        }
    }

    onClick(event) {
        if (this.hoveredObject?.userData.onClick) {
            this.hoveredObject.userData.onClick();
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }

    resetCamera() {
        const duration = 1000;
        const startPos = camera.position.clone();
        const targetPos = new THREE.Vector3(0, 30, 100);
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeOutCubic(progress);

            camera.position.lerpVectors(startPos, targetPos, eased);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    easeOutCubic(x) {
        return 1 - Math.pow(1 - x, 3);
    }

    showControlsHelp() {
        const controlsHelp = document.getElementById('controls-help');
        controlsHelp.classList.remove('hidden');
        
        setTimeout(() => {
            controlsHelp.classList.add('hidden');
        }, 5000);
    }

    toggleControlsHelp() {
        const controlsHelp = document.getElementById('controls-help');
        controlsHelp.classList.toggle('hidden');
    }
}

// Variable global para la instancia de la aplicación
let app = null;

// Inicializar cuando la ventana esté completamente cargada
window.addEventListener('load', async () => {
    console.log('Window loaded');
    if (!app) {
        try {
            // Esperar a que Three.js se inicialice completamente
            console.log('Initializing Three.js...');
            await initUniverse();
            
            // Esperar un momento para asegurar que el contexto WebGL esté listo
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Crear instancia de la aplicación
            console.log('Creating application instance...');
            app = new DoekUniverse();
            
            // Forzar una actualización inicial
            renderer.clear();
            renderer.render(scene, camera);
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Error initializing application:', error);
            // Mostrar error al usuario
            const container = document.getElementById('universe-container');
            if (container) {
                container.innerHTML = '<div style="color: white; text-align: center; padding: 20px;">Error al inicializar la aplicación. Por favor, recarga la página.</div>';
            }
        }
    }
});
