import { THREE, scene, camera, renderer, UNIVERSE_SIZE } from './init.js';

export class UniverseControls {
    constructor() {
        this.enabled = true;
        this.zoomSpeed = 1.5;
        this.rotateSpeed = 1.2;
        this.dampingFactor = 0.03;
        this.minDistance = 0.1;
        this.maxDistance = Infinity;
        this.currentTarget = null;
        this.isMovingToTarget = false;
        this.targetLerpFactor = 0.05;
        
        // Estado de los controles
        this.state = {
            isRotating: false,
            isZooming: false,
            isPanning: false,
            lastX: 0,
            lastY: 0,
            lastMidX: null,
            lastMidY: null,
            lastFingerDistance: null
        };

        // Asegurarse de que el renderer esté disponible
        if (!renderer || !renderer.domElement) {
            console.error('Renderer no inicializado');
            return;
        }

        this.initializeControls();
    }

    initializeControls() {
        console.log('Initializing universe controls');
        // Eliminar OrbitControls para tener navegación completamente libre
        this.setupCustomControls();
        this.setupVisualEffects();
    }

    setupCustomControls() {
        const container = renderer.domElement;

        // Eventos táctiles
        container.addEventListener('touchstart', (e) => this.onTouchStart(e));
        container.addEventListener('touchmove', (e) => this.onTouchMove(e));
        container.addEventListener('touchend', () => this.onTouchEnd());

        // Eventos de teclado
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));

        // Eventos de mouse
        container.addEventListener('wheel', (e) => this.onMouseWheel(e));
        container.addEventListener('mousedown', (e) => this.onMouseDown(e));
        container.addEventListener('mousemove', (e) => this.onMouseMove(e));
        container.addEventListener('mouseup', () => this.onMouseUp());
        container.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    onMouseDown(event) {
        if (!this.enabled) return;
        event.preventDefault();

        // Click izquierdo para rotar, click derecho para pan
        if (event.button === 0) {
            this.state.isRotating = true;
            this.state.lastX = event.clientX;
            this.state.lastY = event.clientY;
        } else if (event.button === 2) {
            this.state.isPanning = true;
            this.state.lastX = event.clientX;
            this.state.lastY = event.clientY;
        }
    }

    onMouseMove(event) {
        if (!this.enabled) return;
        event.preventDefault();

        if (this.state.isRotating) {
            const deltaX = event.clientX - this.state.lastX;
            const deltaY = event.clientY - this.state.lastY;
            
            // Invertir deltaX y deltaY para que el movimiento sea natural
            this.rotateScene(-deltaX * 0.005, -deltaY * 0.005);
            
            this.state.lastX = event.clientX;
            this.state.lastY = event.clientY;
        } else if (this.state.isPanning) {
            const deltaX = event.clientX - this.state.lastX;
            const deltaY = event.clientY - this.state.lastY;
            
            // Calcular el movimiento en el plano de la cámara
            const right = new THREE.Vector3();
            const up = new THREE.Vector3();
            const forward = new THREE.Vector3();
            camera.matrix.extractBasis(right, up, forward);
            
            // Ajustar la velocidad del pan según la distancia
            const panSpeed = Math.max(1, camera.position.length() / 100);
            
            // Aplicar el movimiento
            camera.position.addScaledVector(right, -deltaX * panSpeed);
            camera.position.addScaledVector(up, deltaY * panSpeed);
            
            this.state.lastX = event.clientX;
            this.state.lastY = event.clientY;
        }
    }

    onMouseUp() {
        this.state.isRotating = false;
        this.state.isPanning = false;
    }

    setupVisualEffects() {
        // Crear efecto de rastro de navegación
        this.navigationTrail = document.createElement('div');
        this.navigationTrail.className = 'navigation-trail';
        document.body.appendChild(this.navigationTrail);
    }

    onTouchStart(event) {
        if (!this.enabled) return;
        event.preventDefault();

        if (event.touches.length === 1) {
            // Un dedo para rotar
            this.state.isRotating = true;
            this.state.lastX = event.touches[0].pageX;
            this.state.lastY = event.touches[0].pageY;
        } else if (event.touches.length === 2) {
            // Dos dedos para zoom
            this.state.isZooming = true;
            const dx = event.touches[0].pageX - event.touches[1].pageX;
            const dy = event.touches[0].pageY - event.touches[1].pageY;
            this.state.pinchDistance = Math.sqrt(dx * dx + dy * dy);
        } else if (event.touches.length === 3) {
            // Tres dedos para pan
            this.state.isPanning = true;
            this.state.lastX = event.touches[0].pageX;
            this.state.lastY = event.touches[0].pageY;
        }
    }

    onTouchMove(event) {
        if (!this.enabled) return;
        event.preventDefault();

        if (event.touches.length === 1 && this.state.isRotating) {
            // Un dedo para rotar (movimiento invertido)
            const currentX = event.touches[0].pageX;
            const currentY = event.touches[0].pageY;
            const deltaX = currentX - this.state.lastX;
            const deltaY = currentY - this.state.lastY;
            
            // Invertir deltaX para que el movimiento sea natural
            this.rotateScene(-deltaX * 0.005, -deltaY * 0.005);
            
            this.state.lastX = currentX;
            this.state.lastY = currentY;
        } else if (event.touches.length === 2 && this.state.isZooming) {
            // Dos dedos para zoom
            const dx = event.touches[0].pageX - event.touches[1].pageX;
            const dy = event.touches[0].pageY - event.touches[1].pageY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Calcular el factor de zoom basado en el cambio de distancia entre dedos
            const currentDistance = camera.position.length();
            const zoomFactor = Math.max(1, currentDistance / 50); // Factor de escala basado en la distancia
            const zoomDelta = (distance - this.state.pinchDistance) * 0.05 * zoomFactor; // Aumentar sensibilidad base y aplicar factor
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            
            // Aplicar zoom con mayor amplitud
            camera.position.addScaledVector(direction, zoomDelta);
            
            this.state.pinchDistance = distance;
        } else if (event.touches.length === 3 && this.state.isPanning) {
            // Tres dedos para pan
            const currentX = event.touches[0].pageX;
            const currentY = event.touches[0].pageY;
            const deltaX = currentX - this.state.lastX;
            const deltaY = currentY - this.state.lastY;
            
            // Calcular el movimiento en el plano de la cámara
            const right = new THREE.Vector3();
            const up = new THREE.Vector3();
            camera.matrix.extractBasis(right, up);
            
            // Ajustar la velocidad del pan según la distancia
            const panSpeed = Math.max(1, camera.position.length() / 100);
            
            // Aplicar el movimiento
            camera.position.addScaledVector(right, -deltaX * panSpeed);
            camera.position.addScaledVector(up, deltaY * panSpeed);
            
            this.state.lastX = currentX;
            this.state.lastY = currentY;
        }
    }

    onTouchEnd() {
        this.state.isRotating = false;
        this.state.isZooming = false;
        this.state.lastMidX = null;
        this.state.lastMidY = null;
        this.state.lastFingerDistance = null;
    }

    onMouseWheel(event) {
        if (!this.enabled) return;
        event.preventDefault();
        
        // Obtener la dirección de la cámara
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        
        // Calcular el factor de zoom basado en la distancia actual
        // Aumentar la sensibilidad base y el factor de escala
        const currentDistance = camera.position.length();
        const distanceFactor = Math.max(1, currentDistance / 50); // Factor más agresivo
        const baseZoomSpeed = 0.5; // Velocidad base más alta
        const zoomSpeed = baseZoomSpeed * distanceFactor;
        
        // Mover la cámara hacia adelante o atrás basado en el scroll
        // Multiplicar por 2 para hacer el movimiento más agresivo
        if (event.deltaY > 0) {
            // Zoom out
            camera.position.addScaledVector(direction, -zoomSpeed * 2);
        } else {
            // Zoom in
            camera.position.addScaledVector(direction, zoomSpeed * 2);
        }
    }


    isWithinUniverseBounds(position) {
        // Permitimos movimiento infinito
        return true;
    }

    rotateLeft() {
        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.1);
        camera.quaternion.premultiply(quaternion);
        camera.quaternion.normalize();
    }

    rotateRight() {
        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -0.1);
        camera.quaternion.premultiply(quaternion);
        camera.quaternion.normalize();
    }

    rotateScene(angleX, angleY) {
        // Rotar la cámara alrededor de su posición actual
        const rotationMatrix = new THREE.Matrix4();
        
        // Rotación en Y (izquierda/derecha)
        rotationMatrix.makeRotationY(-angleX);
        camera.quaternion.premultiply(new THREE.Quaternion().setFromRotationMatrix(rotationMatrix));
        
        // Rotación en X (arriba/abajo)
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        rotationMatrix.makeRotationAxis(right, -angleY);
        camera.quaternion.premultiply(new THREE.Quaternion().setFromRotationMatrix(rotationMatrix));
        
        camera.quaternion.normalize();
    }


    showNavigationEffect(direction) {
        this.navigationTrail.style.opacity = '1';
        
        switch(direction) {
            case 'forward':
                this.navigationTrail.style.transform = 'rotate(0deg)';
                break;
            case 'backward':
                this.navigationTrail.style.transform = 'rotate(180deg)';
                break;
            case 'left':
                this.navigationTrail.style.transform = 'rotate(-90deg)';
                break;
            case 'right':
                this.navigationTrail.style.transform = 'rotate(90deg)';
                break;
        }

        setTimeout(() => {
            this.navigationTrail.style.opacity = '0';
        }, 200);
    }

    findNearestPlanet(direction) {
        // Obtener la posición actual de la cámara
        const cameraPos = camera.position.clone();
        const cameraDir = new THREE.Vector3();
        camera.getWorldDirection(cameraDir);
        
        // Vectores de dirección para cada flecha
        const directions = {
            'ArrowLeft': new THREE.Vector3(-1, 0, 0),
            'ArrowRight': new THREE.Vector3(1, 0, 0),
            'ArrowUp': new THREE.Vector3(0, 1, 0),
            'ArrowDown': new THREE.Vector3(0, -1, 0)
        };
        
        // Obtener todos los planetas de la escena
        let nearestPlanet = null;
        let minDistance = Infinity;
        const dirVector = directions[direction];
        
        // Obtener el plano perpendicular a la dirección de búsqueda
        const planeNormal = dirVector.clone();
        const currentPlane = new THREE.Plane(planeNormal, -cameraPos.dot(planeNormal));
        
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh && object.userData && object.userData.result) {
                const planetPos = object.position.clone();
                const toCameraVector = planetPos.clone().sub(cameraPos);
                
                // Proyectar el vector al planeta en la dirección deseada
                const projectedDistance = toCameraVector.dot(dirVector);
                
                // Solo considerar planetas en la dirección correcta y que no sean el actual
                if (projectedDistance > 0 && (!this.currentTarget || object.id !== this.currentTarget.id)) {
                    // Calcular la distancia al plano perpendicular
                    const distanceToPlane = Math.abs(currentPlane.distanceToPoint(planetPos));
                    // Combinar la distancia proyectada y la distancia al plano para favorecer objetos más alineados
                    const combinedDistance = distanceToPlane * 2 + projectedDistance;
                    
                    if (combinedDistance < minDistance) {
                        minDistance = combinedDistance;
                        nearestPlanet = object;
                    }
                }
            }
        });
        
        return nearestPlanet;
    }

    moveToTarget(target) {
        if (!target) return;
        
        // Si ya estamos en movimiento, completar el movimiento actual primero
        if (this.isMovingToTarget) {
            camera.position.copy(this.targetPosition);
            camera.quaternion.copy(this.targetRotation);
        }
        
        this.currentTarget = target;
        this.isMovingToTarget = true;
        
        // Calcular posición objetivo (más elevada y alejada del planeta)
        const planetRadius = target.geometry.parameters.radius;
        // Ajustar offset según la dirección del movimiento
        const isLateralMovement = this.lastKeyPressed === 'ArrowLeft' || this.lastKeyPressed === 'ArrowRight';
        const offset = planetRadius * (isLateralMovement ? 6 : 7); // Mayor distancia para movimientos laterales
        const heightOffset = planetRadius * 3; // Mantener el offset vertical
        
        // Crear vector desde el planeta hacia la cámara actual
        const toCamera = camera.position.clone().sub(target.position).normalize();
        
        // Posición final = posición del planeta + vector hacia la cámara * offset + altura adicional
        this.targetPosition = target.position.clone()
            .add(toCamera.multiplyScalar(offset))
            .add(new THREE.Vector3(0, heightOffset,0)); // Añadir altura
        
        // Guardar la rotación actual
        this.startRotation = camera.quaternion.clone();
        
        // Calcular rotación objetivo (mirando hacia el planeta)
        this.targetRotation = new THREE.Quaternion();
        const lookAt = new THREE.Matrix4();
        lookAt.lookAt(this.targetPosition, target.position, camera.up);
        this.targetRotation.setFromRotationMatrix(lookAt);
    }

    update() {
        if (this.enabled) {
            if (this.isMovingToTarget && this.currentTarget) {
                // Interpolar posición
                camera.position.lerp(this.targetPosition, this.targetLerpFactor);
                
                // Interpolar rotación
                camera.quaternion.slerp(this.targetRotation, this.targetLerpFactor);
                
                // Verificar si hemos llegado lo suficientemente cerca
                if (camera.position.distanceTo(this.targetPosition) < 0.1) {
                    this.isMovingToTarget = false;
                    this.currentTarget = null;
                }
            } else if (!this.state.isMoving) {
                // Desaceleración normal cuando no hay movimiento
                this.currentSpeed = Math.max(this.moveSpeed, this.currentSpeed * this.deceleration);
            }
        }
    }

    onKeyDown(event) {
        if (!this.enabled) return;

        // Manejar la tecla Enter en campos de búsqueda
        if (document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA') {
            if (event.key === 'Enter') {
                // Buscar el botón de búsqueda
                const searchButton = document.querySelector('#search-button, button[type="submit"], button.search-button');
                if (searchButton) {
                    // Ejecutar la búsqueda
                    searchButton.click();
                    
                    // Devolver el foco al canvas del universo
                    const canvas = renderer.domElement;
                    canvas.focus();
                    
                    // Remover el foco del input
                    document.activeElement.blur();
                    
                    // Prevenir el comportamiento por defecto del Enter
                    event.preventDefault();
                }
            }
            return;
        }

        this.state.isMoving = true;
        switch(event.key) {
            case 'q': this.rotateLeft(); break;
            case 'e': this.rotateRight(); break;
            case '|': 
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                } else {
                    document.documentElement.requestFullscreen();
                }
                break;
            case 'ArrowLeft':
            case 'ArrowRight':
            case 'ArrowUp':
            case 'ArrowDown':
                this.lastKeyPressed = event.key;
                const nearestPlanet = this.findNearestPlanet(event.key);
                if (nearestPlanet) {
                    this.moveToTarget(nearestPlanet);
                }
                break;
        }
    }

    onKeyUp(event) {
        if (!this.enabled) return;

        this.state.isMoving = false;
        if (event.key.toLowerCase() === 'shift') {
            this.maxMoveSpeed = Infinity; // Mantener velocidad infinita
        }
    }

    dispose() {
        if (this.navigationTrail && this.navigationTrail.parentNode) {
            this.navigationTrail.parentNode.removeChild(this.navigationTrail);
        }
    }
}
