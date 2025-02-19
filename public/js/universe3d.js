// Esperar a que todas las dependencias estén cargadas
window.addEventListener('load', () => {
    // Verificar que Three.js esté cargado
    if (typeof THREE === 'undefined') {
        console.error('Three.js no está cargado');
        return;
    }

    class Universe3D {
        constructor() {
            console.log('Inicializando Universe3D...');
            
            // Inicialización básica
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer({
                canvas: document.getElementById('universe'),
                antialias: true
            });
            
            console.log('Configurando renderer...');
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setClearColor(0x000000);

            // Datos de los planetas
            this.planets = [];
            this.planetData = [
                { section: 'inicio', color: 0x4361EE, size: 2 },
                { section: 'instalacion', color: 0x3F37C9, size: 1.8 },
                { section: 'avances', color: 0x4CC9F0, size: 1.6 },
                { section: 'documentacion', color: 0x72DDF7, size: 1.7 }
            ];

            this.init();
        }

        init() {
            console.log('Iniciando configuración...');
            this.setupScene();
            this.createPlanets();
            this.setupLights();
            this.setupControls();
            this.addEventListeners();
            this.animate();
            console.log('Inicialización completada');
        }

        setupScene() {
            console.log('Configurando escena...');
            this.camera.position.z = 15;
            
            // Fondo de estrellas
            const starGeometry = new THREE.BufferGeometry();
            const starVertices = [];
            for (let i = 0; i < 10000; i++) {
                starVertices.push(
                    Math.random() * 2000 - 1000,
                    Math.random() * 2000 - 1000,
                    Math.random() * 2000 - 1000
                );
            }
            starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
            
            const starMaterial = new THREE.PointsMaterial({
                color: 0xFFFFFF,
                size: 0.1
            });

            this.stars = new THREE.Points(starGeometry, starMaterial);
            this.scene.add(this.stars);
        }

        createPlanets() {
            console.log('Creando planetas...');
            this.planetData.forEach((data, index) => {
                const geometry = new THREE.SphereGeometry(data.size, 32, 32);
                const material = new THREE.MeshPhongMaterial({
                    color: data.color,
                    emissive: data.color,
                    emissiveIntensity: 0.2,
                    shininess: 50
                });

                const planet = new THREE.Mesh(geometry, material);

                const angle = (index / this.planetData.length) * Math.PI * 2;
                const radius = 8;
                planet.position.x = Math.cos(angle) * radius;
                planet.position.y = Math.sin(angle) * radius;

                const ringGeometry = new THREE.RingGeometry(data.size * 1.2, data.size * 1.4, 32);
                const ringMaterial = new THREE.MeshBasicMaterial({
                    color: data.color,
                    transparent: true,
                    opacity: 0.3,
                    side: THREE.DoubleSide
                });
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.rotation.x = Math.PI / 2;
                planet.add(ring);

                this.scene.add(planet);
                this.planets.push({
                    mesh: planet,
                    section: data.section
                });
            });
        }

        setupLights() {
            console.log('Configurando luces...');
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
            this.scene.add(ambientLight);

            const mainLight = new THREE.PointLight(0xffffff, 1);
            mainLight.position.set(10, 10, 10);
            this.scene.add(mainLight);

            const accentLight = new THREE.PointLight(0x4CC9F0, 2);
            accentLight.position.set(-10, -10, -10);
            this.scene.add(accentLight);
        }

        setupControls() {
            console.log('Configurando controles...');
            if (typeof THREE.OrbitControls === 'undefined') {
                console.error('OrbitControls no está cargado');
                return;
            }
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.minDistance = 10;
            this.controls.maxDistance = 30;
        }

        addEventListeners() {
            console.log('Agregando event listeners...');
            window.addEventListener('resize', () => {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            });

            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();

            this.renderer.domElement.addEventListener('click', (event) => {
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

                raycaster.setFromCamera(mouse, this.camera);
                const intersects = raycaster.intersectObjects(this.planets.map(p => p.mesh));

                if (intersects.length > 0) {
                    const planet = this.planets.find(p => p.mesh === intersects[0].object);
                    if (planet) {
                        this.showInfo(planet.section);
                        this.focusPlanet(planet);
                    }
                }
            });
        }

        showInfo(section) {
            console.log('Mostrando información de:', section);
            const template = document.querySelector(`[data-template="${section}"]`);
            const infoPanel = document.getElementById('info-panel');
            if (template && infoPanel) {
                infoPanel.querySelector('.panel-content').innerHTML = template.innerHTML;
                infoPanel.classList.add('active');
            }
        }

        focusPlanet(planet) {
            console.log('Enfocando planeta:', planet.section);
            const targetPosition = new THREE.Vector3();
            planet.mesh.getWorldPosition(targetPosition);
            targetPosition.z += 5;

            if (typeof TWEEN !== 'undefined') {
                new TWEEN.Tween(this.camera.position)
                    .to({
                        x: targetPosition.x,
                        y: targetPosition.y,
                        z: targetPosition.z
                    }, 1000)
                    .easing(TWEEN.Easing.Cubic.InOut)
                    .start();

                new TWEEN.Tween(this.controls.target)
                    .to({
                        x: planet.mesh.position.x,
                        y: planet.mesh.position.y,
                        z: planet.mesh.position.z
                    }, 1000)
                    .easing(TWEEN.Easing.Cubic.InOut)
                    .start();
            }
        }

        animate() {
            requestAnimationFrame(() => this.animate());

            this.planets.forEach(planet => {
                planet.mesh.rotation.y += 0.005;
                if (planet.mesh.children[0]) {
                    planet.mesh.children[0].rotation.z += 0.002;
                }
            });

            this.stars.rotation.y += 0.0001;

            if (typeof TWEEN !== 'undefined') {
                TWEEN.update();
            }
            
            if (this.controls) {
                this.controls.update();
            }
            
            this.renderer.render(this.scene, this.camera);
        }
    }

    // Crear instancia
    try {
        console.log('Creando instancia de Universe3D...');
        window.universe = new Universe3D();
        console.log('Universe3D inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar Universe3D:', error);
    }
});
