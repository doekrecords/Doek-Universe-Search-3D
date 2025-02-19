import { THREE, scene, particleSystem, renderer } from '../core/init.js';

export class CelestialManager {
    constructor() {
        console.log('Initializing CelestialManager');
        this.resultObjects = new Map();
        this.targetPositions = new Map();
        
        // Materiales predefinidos
        this.materials = {
            star: new THREE.MeshPhongMaterial({
                color: 0x4361EE,
                emissive: 0x4361EE,
                emissiveIntensity: 0.8, // Aumentar intensidad emisiva
                shininess: 150, // Aumentar brillo
                transparent: true,
                opacity: 0.9 // Aumentar opacidad base
            }),
            highlight: new THREE.MeshPhongMaterial({
                color: 0x9D4EDD,
                emissive: 0x9D4EDD,
                emissiveIntensity: 1.0, // Aumentar intensidad emisiva al máximo
                shininess: 200, // Aumentar brillo al máximo
                transparent: true,
                opacity: 1.0 // Opacidad completa
            })
        };

        this.setupLights();
        
        // Iniciar el bucle de actualización
        this.animate = this.animate.bind(this);
        this.animate();
        
        console.log('CelestialManager initialized');
    }

    setupLights() {
        console.log('Setting up lights');
        // Luz ambiental brillante para iluminación base
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        // Luz principal frontal intensa
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
        mainLight.position.set(0, 100, 200);
        scene.add(mainLight);

        // Luz de relleno colorida
        const fillLight = new THREE.DirectionalLight(0x4361EE, 0.8);
        fillLight.position.set(-150, 0, -50);
        scene.add(fillLight);

        // Luz de contorno brillante
        const rimLight = new THREE.DirectionalLight(0x9D4EDD, 0.6);
        rimLight.position.set(150, 0, -50);
        scene.add(rimLight);

        // Luz hemisférica para ambiente suave
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
        scene.add(hemiLight);

        // Luz puntual central para resaltar
        const centerLight = new THREE.PointLight(0xffffff, 0.8, 1000);
        centerLight.position.set(0, 0, 0);
        scene.add(centerLight);
    }

    updateUniverse(results) {
        console.log('Updating universe with results:', results);
        try {
            this.clearCurrentResults();
            results.forEach((result, index) => {
                try {
                    this.createCelestialObject(result, index, results.length);
                } catch (error) {
                    console.error('Error creating celestial object:', error);
                }
            });
            this.animateNewObjects();
        } catch (error) {
            console.error('Error updating universe:', error);
        }
    }

    calculatePosition(index, total) {
        // Distribución en espiral logarítmica más amplia
        const angle = (index / total) * Math.PI * 4; // 2 vueltas completas
        const baseRadius = 150; // Radio base más grande
        const radius = baseRadius + (index * 20); // Mayor separación entre objetos
        
        // Calcular posición usando coordenadas esféricas
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(angle * 2) * 30; // Ondulación vertical más suave
        
        return new THREE.Vector3(x, y, z);
    }

    createCelestialObject(result, index, totalResults) {
        console.log('Creating celestial object for:', result.title);
        try {
            const position = this.calculatePosition(index, totalResults);
            
            // Geometría mejorada
            const baseSize = 2;
            const maxSize = 8; // Aumentar el tamaño máximo
            const size = baseSize + (result.relevance * (maxSize - baseSize));
            const segments = Math.max(16, Math.floor(32 * result.relevance));
            const geometry = new THREE.SphereGeometry(size, segments, segments);
            
            // Crear textura procedural mejorada
            const textureSize = 512; // Aumentar resolución
            const canvas = document.createElement('canvas');
            canvas.width = textureSize;
            canvas.height = textureSize;
            const ctx = canvas.getContext('2d');
            
            // Colores vibrantes de planetas
            const colorPalettes = [
                // Marte (rojo intenso)
                { base: [0.02, 0.95, 0.4], accent: [0.05, 0.85, 0.3], 
                  craters: true, atmosphere: false, bands: false },
                // Júpiter (naranja dorado)
                { base: [0.08, 0.95, 0.5], accent: [0.1, 0.85, 0.4],
                  craters: false, atmosphere: true, bands: true },
                // Neptuno (azul profundo)
                { base: [0.6, 0.85, 0.4], accent: [0.58, 0.9, 0.5],
                  craters: false, atmosphere: true, bands: true },
                // Venus (amarillo cálido)
                { base: [0.15, 0.9, 0.5], accent: [0.12, 0.85, 0.4],
                  craters: false, atmosphere: true, bands: false },
                // Mercurio (gris metálico)
                { base: [0.0, 0.2, 0.5], accent: [0.0, 0.3, 0.4],
                  craters: true, atmosphere: false, bands: false }
            ];

            const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
            const planetColor = new THREE.Color().setHSL(...palette.base);
            const highlightColor = new THREE.Color().setHSL(...palette.accent);
            
            // Fondo con gradiente radial realista
            const planetGradient = ctx.createRadialGradient(
                textureSize/2, textureSize/2, 0,
                textureSize/2, textureSize/2, textureSize/2
            );
            planetGradient.addColorStop(0, `rgb(${planetColor.r * 255}, ${planetColor.g * 255}, ${planetColor.b * 255})`);
            planetGradient.addColorStop(0.8, `rgb(${highlightColor.r * 255}, ${highlightColor.g * 255}, ${highlightColor.b * 255})`);
            planetGradient.addColorStop(1, `rgb(${planetColor.r * 255}, ${planetColor.g * 255}, ${planetColor.b * 255})`);
            ctx.fillStyle = planetGradient;
            ctx.fillRect(0, 0, textureSize, textureSize);

            // Añadir características específicas del planeta
            if (palette.craters) {
                // Crear cráteres realistas
                for (let i = 0; i < 300; i++) {
                    const x = Math.random() * textureSize;
                    const y = Math.random() * textureSize;
                    const size = Math.random() * 20 + 5;
                    
                    // Gradiente para el cráter
                    const craterGradient = ctx.createRadialGradient(
                        x, y, 0,
                        x, y, size
                    );
                    
                    craterGradient.addColorStop(0, `rgba(40, 40, 40, 0.6)`);
                    craterGradient.addColorStop(0.8, `rgba(80, 80, 80, 0.3)`);
                    craterGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    
                    ctx.fillStyle = craterGradient;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            if (palette.bands) {
                // Crear bandas atmosféricas
                const bandCount = 8;
                const bandHeight = textureSize / bandCount;
                
                for (let i = 0; i < bandCount; i++) {
                    const y = i * bandHeight;
                    const opacity = Math.random() * 0.2 + 0.1;
                    
                    ctx.fillStyle = `rgba(${highlightColor.r * 255}, ${highlightColor.g * 255}, ${highlightColor.b * 255}, ${opacity})`;
                    ctx.fillRect(0, y, textureSize, bandHeight / 2);
                }
            }

            if (palette.atmosphere) {
                // Añadir efecto de atmósfera
                const atmosphereGradient = ctx.createRadialGradient(
                    textureSize/2, textureSize/2, textureSize/3,
                    textureSize/2, textureSize/2, textureSize/2
                );
                
                atmosphereGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
                atmosphereGradient.addColorStop(0.7, `rgba(${highlightColor.r * 255}, ${highlightColor.g * 255}, ${highlightColor.b * 255}, 0.1)`);
                atmosphereGradient.addColorStop(1, `rgba(${highlightColor.r * 255}, ${highlightColor.g * 255}, ${highlightColor.b * 255}, 0.2)`);
                
                ctx.fillStyle = atmosphereGradient;
                ctx.fillRect(0, 0, textureSize, textureSize);
            }

            // Añadir destellos brillantes
            for (let i = 0; i < 1000; i++) {
                const x = Math.random() * textureSize;
                const y = Math.random() * textureSize;
                const size = Math.random() * 3 + 1;
                
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.2})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Crear y configurar textura
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, 1);
            texture.needsUpdate = true;
            
            // Generar mapa de normales
            const normalCanvas = document.createElement('canvas');
            normalCanvas.width = textureSize;
            normalCanvas.height = textureSize;
            const normalCtx = normalCanvas.getContext('2d');
            
            // Crear patrón de normales
            for (let i = 0; i < 5000; i++) {
                const x = Math.random() * textureSize;
                const y = Math.random() * textureSize;
                const size = Math.random() * 4 + 1;
                normalCtx.fillStyle = `rgba(128, 128, 255, ${Math.random() * 0.2})`;
                normalCtx.beginPath();
                normalCtx.arc(x, y, size, 0, Math.PI * 2);
                normalCtx.fill();
            }
            
            const normalTexture = new THREE.CanvasTexture(normalCanvas);
            normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
            normalTexture.needsUpdate = true;
            
            // Material con textura y efectos de luz mejorados
            const material = new THREE.MeshStandardMaterial({
                color: planetColor,
                map: texture,
                transparent: true,
                opacity: 0,
                metalness: 0.2,
                roughness: 0.7,
                emissive: highlightColor,
                emissiveIntensity: 0.3 + (result.relevance * 0.3),
                envMapIntensity: 0.8
            });

            // Configurar la textura para máxima calidad
            if (renderer && renderer.capabilities) {
                texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            }
            texture.minFilter = THREE.LinearMipMapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = true;
            texture.needsUpdate = true;

            // Asegurar que el material se actualice
            material.needsUpdate = true;
            
            const mesh = new THREE.Mesh(geometry, material);
            
            mesh.position.copy(position);
            mesh.material.opacity = 0;
            mesh.userData = {
                result: result,
                originalScale: size
            };

            this.addFloatingTitle(mesh, result.title);
            scene.add(mesh);
            this.resultObjects.set(mesh.id, mesh);
            this.addInteractivity(mesh);
            this.fadeIn(mesh);

            // Efecto de brillo suave
            const glowIntensity = 0.15 + (result.relevance * 0.3);
            const glowDistance = size * (6 + (result.relevance * 3));
            
            // Luz principal con el color del planeta
            const glowColor = planetColor.clone().lerp(highlightColor, 0.5);
            const glow = new THREE.PointLight(glowColor.getHex(), glowIntensity, glowDistance);
            glow.position.copy(position);
            scene.add(glow);

            console.log('Celestial object created successfully:', mesh.id);
            return mesh;
        } catch (error) {
            console.error('Error in createCelestialObject:', error);
            return null;
        }
    }

    addFloatingTitle(mesh, title) {
        try {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            // Configuración futurista del texto
            context.font = 'Bold 24px "Orbitron", "Rajdhani", sans-serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            
            // Asegurar que el título tenga suficiente espacio
            const textWidth = context.measureText(title).width;
            canvas.width = textWidth + 120; // Más espacio para efectos y margen
            canvas.height = 80; // Altura mayor para mejor visibilidad
            
            // Fondo futurista con patrón de cuadrícula
            context.fillStyle = 'rgb(16, 24, 48)'; // Azul oscuro sólido
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Dibujar patrón de cuadrícula
            const gridSize = 4;
            context.strokeStyle = 'rgb(32, 48, 96)'; // Azul medio sólido
            context.lineWidth = 0.5;
            
            // Líneas horizontales
            for (let y = 0; y <= canvas.height; y += gridSize) {
                context.beginPath();
                context.moveTo(0, y);
                context.lineTo(canvas.width, y);
                context.stroke();
            }
            
            // Líneas verticales
            for (let x = 0; x <= canvas.width; x += gridSize) {
                context.beginPath();
                context.moveTo(x, 0);
                context.lineTo(x, canvas.height);
                context.stroke();
            }
            
            // Añadir brillo en los bordes
            const edgeGlow = context.createLinearGradient(0, 0, canvas.width, canvas.height);
            edgeGlow.addColorStop(0, 'rgb(67, 134, 255)');
            edgeGlow.addColorStop(0.5, 'rgb(32, 64, 128)');
            edgeGlow.addColorStop(1, 'rgb(67, 134, 255)');
            context.strokeStyle = edgeGlow;
            context.lineWidth = 2;
            context.strokeRect(0, 0, canvas.width, canvas.height);
            
            // Redibujar con efectos futuristas
            context.font = 'Bold 24px "Orbitron", "Rajdhani", sans-serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            
            // Efecto de borde brillante
            context.strokeStyle = 'rgba(67, 97, 238, 0.8)';
            context.lineWidth = 2;
            context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
            
            // Múltiples capas de sombra para efecto de brillo
            for (let i = 0; i < 3; i++) {
                context.shadowColor = 'rgba(67, 97, 238, 0.5)';
                context.shadowBlur = 10 + i * 5;
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;
                context.fillText(title, canvas.width/2, canvas.height/2);
            }
            
            // Texto principal con brillo
            context.shadowColor = 'rgba(157, 78, 221, 0.8)';
            context.shadowBlur = 15;
            context.fillStyle = '#ffffff';
            context.fillText(title, canvas.width/2, canvas.height/2);
            
            // Líneas decorativas
            context.strokeStyle = 'rgba(67, 97, 238, 0.5)';
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(10, 10);
            context.lineTo(30, 10);
            context.moveTo(canvas.width - 30, 10);
            context.lineTo(canvas.width - 10, 10);
            context.moveTo(10, canvas.height - 10);
            context.lineTo(30, canvas.height - 10);
            context.moveTo(canvas.width - 30, canvas.height - 10);
            context.lineTo(canvas.width - 10, canvas.height - 10);
            context.stroke();
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ 
                map: texture,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthTest: true // Asegura que siempre sea visible
            });
            
            const sprite = new THREE.Sprite(spriteMaterial);
            
            // Ajustar posición y escala para mejor visibilidad
            const scaleBase = Math.max(canvas.width, canvas.height) / 25;
            sprite.scale.set(canvas.width / scaleBase, canvas.height / scaleBase, 1);
            
            // Hacer que el sprite siempre esté centrado y mire a la cámara
            sprite.onBeforeRender = function(renderer, scene, camera) {
                // Posicionar el título debajo del planeta
                sprite.position.copy(mesh.position);
                sprite.position.y += mesh.geometry.parameters.radius * 1.3;
                
                // Hacer que el título mire a la cámara
                sprite.quaternion.copy(camera.quaternion);
            };
            
            scene.add(sprite); // Añadir directamente a la escena en lugar de al mesh
        } catch (error) {
            console.error('Error adding floating title:', error);
        }
    }

    addInteractivity(mesh) {
        mesh.userData.onHover = () => {
            const relevance = mesh.userData.result.relevance || 0.5;
            if (particleSystem) {
                particleSystem.createExplosionEffect(
                    mesh.position,
                    0x9D4EDD,
                    0.3 + (relevance * 0.7)
                );
            }
            
            // Aumentar emisividad y brillo en hover
            if (mesh.material instanceof THREE.MeshStandardMaterial) {
                mesh.material.emissiveIntensity = 1.0 + (relevance * 0.8);
                mesh.material.metalness = 0.5;
                mesh.material.roughness = 0.2;
            }
            mesh.material.opacity = 1;
            
            // Efecto de escala suave con rebote
            const scale = 1.3 + (relevance * 0.2);
            mesh.scale.set(scale, scale, scale);
        };

        mesh.userData.onHoverEnd = () => {
            const relevance = mesh.userData.result.relevance || 0.5;
            // Restaurar valores originales
            if (mesh.material instanceof THREE.MeshStandardMaterial) {
                mesh.material.emissiveIntensity = 0.6 + (relevance * 0.5);
                mesh.material.metalness = 0.3;
                mesh.material.roughness = 0.4;
            }
            mesh.material.opacity = 1;
            
            // Restaurar escala original con transición suave
            mesh.scale.set(1, 1, 1);
        };

        mesh.userData.onClick = () => {
            if (mesh.userData.result && mesh.userData.result.url) {
                window.open(mesh.userData.result.url, '_blank');
            }
        };
    }

    fadeIn(mesh, duration = 1000) {
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            mesh.material.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    clearCurrentResults() {
        console.log('Clearing current results');
        try {
            // Eliminar todos los sprites (títulos) y meshes de la escena
            scene.traverse((object) => {
                if (object instanceof THREE.Sprite || 
                    (object instanceof THREE.Mesh && object.userData && object.userData.result)) {
                    scene.remove(object);
                    if (object.material) {
                        if (object.material.map) {
                            object.material.map.dispose();
                        }
                        object.material.dispose();
                    }
                    if (object.geometry) {
                        object.geometry.dispose();
                    }
                }
            });
            
            this.resultObjects.clear();
            this.targetPositions.clear();
        } catch (error) {
            console.error('Error clearing results:', error);
        }
    }

    animateNewObjects() {
        console.log('Animating new objects');
        this.resultObjects.forEach(object => {
            const targetPosition = object.position.clone();
            object.position.set(0, 0, 0);
            this.targetPositions.set(object.id, targetPosition);
            
            // Animación de aparición
            const duration = 1000 + Math.random() * 1000;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = this.easeOutCubic(progress);
                
                const target = this.targetPositions.get(object.id);
                if (target) {
                    object.position.lerp(target, eased);
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            animate();
        });
    }

    easeOutCubic(x) {
        return 1 - Math.pow(1 - x, 3);
    }

    animate() {
        requestAnimationFrame(this.animate);
        
        // Rotar todos los planetas
        this.resultObjects.forEach(object => {
            // Rotar cada planeta con una velocidad basada en su relevancia
            const rotationSpeed = 0.002 + (object.userData.result.relevance * 0.003);
            object.rotation.y += rotationSpeed;
        });
    }
}
