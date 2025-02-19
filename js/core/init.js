import * as THREE from 'three';
import { ParticleSystem } from '../universe/particles.js';
import { UniverseControls } from './controls.js';

// Exportar variables para otros módulos
export { THREE };
export let scene, camera, renderer, controls;
export let particleSystem;

// Configuración inicial
export const UNIVERSE_SIZE = 2000;

// Asegurarse de que Three.js esté cargado
await new Promise(resolve => {
    if (THREE) {
        resolve();
    } else {
        window.addEventListener('load', resolve);
    }
});

// Inicializar Three.js
export async function initUniverse() {
    console.log('Initializing Three.js Universe');
    
    // Configurar el gestor de texturas
    THREE.Cache.enabled = true;
    
    // Crear escena
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000714, 0.0004);

    // Configurar cámara
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        Number.MAX_SAFE_INTEGER
    );
    camera.position.set(0, 100, 500);
    camera.lookAt(0, 0, 0);

    // Configurar renderer con soporte mejorado para texturas
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true
    });
    
    // Configuración avanzada del renderer
    renderer.capabilities.maxTextureSize = 4096;
    renderer.capabilities.precision = 'highp';
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000714, 1);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Habilitar características adicionales
    renderer.physicallyCorrectLights = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    const container = document.getElementById('universe-container');
    if (!container) {
        console.error('No se encontró el contenedor del universo');
        return;
    }
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    // Configurar controles personalizados
    controls = new UniverseControls();

    // Inicializar sistema de partículas y texturas
    if (particleSystem) {
        particleSystem.dispose();
    }
    particleSystem = new ParticleSystem();
    
    // Precarga del gestor de texturas
    THREE.DefaultLoadingManager.onLoad = () => {
        console.log('Todas las texturas cargadas');
    };
    THREE.DefaultLoadingManager.onError = (url) => {
        console.error('Error cargando textura:', url);
    };

    window.addEventListener('resize', onWindowResize, false);
    animate();
    
    console.log('Three.js Universe initialized');
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (particleSystem) {
        particleSystem.update();
    }

    if (controls) {
        controls.update();
    }

    renderer.render(scene, camera);
}
