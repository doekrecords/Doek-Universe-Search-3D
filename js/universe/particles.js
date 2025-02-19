import { THREE, scene } from '../core/init.js';

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.particleCount = 1000;
        this.starFields = [];
        
        // Configuración de materiales mejorada
        this.materials = {
            star: new THREE.PointsMaterial({
                size: 8, // Aumentar aún más el tamaño base
                map: this.createStarTexture(),
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                vertexColors: true,
                opacity: 1.0, // Opacidad completa
                sizeAttenuation: true // Habilitar atenuación de tamaño con la distancia
            }),
            trail: new THREE.PointsMaterial({
                size: 2, // Aumentar tamaño del trail
                color: 0x4361EE,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                opacity: 0.6 // Aumentar opacidad del trail
            })
        };

        this.initializeParticleSystems();
    }

    createStarTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.3, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.5, 'rgba(220,220,255,0.9)');
        gradient.addColorStop(0.7, 'rgba(180,180,255,0.7)');
        gradient.addColorStop(0.9, 'rgba(140,140,255,0.5)');
        gradient.addColorStop(1, 'rgba(100,100,255,0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    initializeParticleSystems() {
        // Crear múltiples campos de estrellas a diferentes distancias
        this.createStarField(this.particleCount * 2, 1000, 0.1); // Lejano, duplicar partículas
        this.createStarField(this.particleCount, 500, 0.3); // Medio, aumentar partículas
        this.createStarField(this.particleCount / 2, 250, 0.5); // Cercano, aumentar partículas
    }

    createStarField(count, size, speed) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        
        for (let i = 0; i < count * 3; i += 3) {
            // Posición aleatoria en una esfera
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const r = Math.random() * size;
            
            positions[i] = r * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = r * Math.cos(phi);
            
            // Velocidad para animación
            velocities[i] = (Math.random() - 0.5) * speed;
            velocities[i + 1] = (Math.random() - 0.5) * speed;
            velocities[i + 2] = (Math.random() - 0.5) * speed;

            // Color aleatorio entre azul y púrpura
            const hue = 0.6 + Math.random() * 0.1; // Rango de azul
            const saturation = 0.8 + Math.random() * 0.2;
            const lightness = 0.6 + Math.random() * 0.4;
            const color = new THREE.Color().setHSL(hue, saturation, lightness);
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = this.materials.star.clone();
        material.vertexColors = true;
        
        const starField = {
            points: new THREE.Points(geometry, material),
            velocities: velocities,
            speed: speed
        };
        
        scene.add(starField.points);
        this.starFields.push(starField);
    }

    createTrailEffect(position, relevance = 1.0) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(20 * 3);
        const colors = new Float32Array(20 * 3);
        const color = new THREE.Color(0x4361EE);
        
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] = position.x;
            positions[i + 1] = position.y;
            positions[i + 2] = position.z;
            
            // Ajustar color basado en relevancia
            colors[i] = color.r * relevance;
            colors[i + 1] = color.g * relevance;
            colors[i + 2] = color.b * relevance;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = this.materials.trail.clone();
        material.vertexColors = true;
        const trail = new THREE.Points(geometry, material);
        scene.add(trail);
        
        this.particles.push({
            mesh: trail,
            life: 1.0,
            decay: 0.02
        });
    }

    createExplosionEffect(position, color = 0x4361EE, intensity = 1.0) {
        const particleCount = 200; // Aumentar aún más el número de partículas
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const baseColor = new THREE.Color(color);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 20; // Aumentar más el radio de explosión
            const height = (Math.random() - 0.5) * 10; // Añadir variación en altura
            
            positions[i] = position.x + Math.cos(angle) * radius;
            positions[i + 1] = position.y + Math.sin(angle) * radius + height;
            positions[i + 2] = position.z;
            
            // Ajustar color basado en intensidad con más brillo y variación
            const distanceFactor = 1 - (Math.sqrt(radius * radius + height * height) / 25);
            colors[i] = baseColor.r * intensity * 2.0 * distanceFactor;
            colors[i + 1] = baseColor.g * intensity * 2.0 * distanceFactor;
            colors[i + 2] = baseColor.b * intensity * 2.0 * distanceFactor;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 4 + (intensity * 4), // Aumentar más el tamaño base y factor de intensidad
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 1.0, // Opacidad completa
            map: this.createStarTexture() // Usar la misma textura que las estrellas
        });
        
        const explosion = new THREE.Points(geometry, material);
        scene.add(explosion);
        
        this.particles.push({
            mesh: explosion,
            life: 1.0,
            decay: 0.03 // Reducir la velocidad de decaimiento
        });
    }

    update() {
        // Actualizar campos de estrellas
        this.starFields.forEach(field => {
            const positions = field.points.geometry.attributes.position.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += field.velocities[i] * field.speed;
                positions[i + 1] += field.velocities[i + 1] * field.speed;
                positions[i + 2] += field.velocities[i + 2] * field.speed;
                
                // Reiniciar si la estrella se aleja demasiado
                const distance = Math.sqrt(
                    positions[i] * positions[i] +
                    positions[i + 1] * positions[i + 1] +
                    positions[i + 2] * positions[i + 2]
                );
                
                if (distance > 1000) {
                    positions[i] *= 0.1;
                    positions[i + 1] *= 0.1;
                    positions[i + 2] *= 0.1;
                }
            }
            
            field.points.geometry.attributes.position.needsUpdate = true;
        });

        // Actualizar partículas
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.life -= particle.decay;
            
            if (particle.life <= 0) {
                scene.remove(particle.mesh);
                particle.mesh.geometry.dispose();
                particle.mesh.material.dispose();
                this.particles.splice(i, 1);
            } else {
                particle.mesh.material.opacity = particle.life;
            }
        }
    }

    dispose() {
        this.starFields.forEach(field => {
            scene.remove(field.points);
            field.points.geometry.dispose();
            field.points.material.dispose();
        });
        
        this.particles.forEach(particle => {
            scene.remove(particle.mesh);
            particle.mesh.geometry.dispose();
            particle.mesh.material.dispose();
        });
        
        this.starFields = [];
        this.particles = [];
    }
}
