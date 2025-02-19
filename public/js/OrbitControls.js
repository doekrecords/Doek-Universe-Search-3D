// OrbitControls.js de ejemplos de Three.js [@DOEKUNIVERSE - Comunidad Global]
( function () {

	// Este conjunto de controles realiza orbitación, zoom y paneo. [@DOEKUNIVERSE - Comunidad Global]
	// A diferencia de TrackballControls, mantiene la dirección "arriba" del objeto. [@DOEKUNIVERSE - Comunidad Global]
	//    Orbit - mouse izquierdo / toque: movimiento de un dedo [@DOEKUNIVERSE - Comunidad Global]
	//    Zoom - mouse medio, o rueda del mouse / toque: expansión o compresión de dos dedos [@DOEKUNIVERSE - Comunidad Global]
	//    Pan - mouse derecho, o mouse izquierdo + ctrl/meta/shiftKey, o teclas de flecha / toque: movimiento de dos dedos [@DOEKUNIVERSE - Comunidad Global]

	const _changeEvent = { type: 'change' };
	const _startEvent = { type: 'start' };
	const _endEvent = { type: 'end' };

	class OrbitControls extends THREE.EventDispatcher {

		constructor( object, domElement ) {

			super();
			if ( domElement === undefined ) console.warn( 'THREE.OrbitControls: El segundo parámetro "domElement" ahora es obligatorio.' );
			if ( domElement === document ) console.error( 'THREE.OrbitControls: "document" no debe ser utilizado como el "domElement" objetivo. Por favor, usa "renderer.domElement" en su lugar.' ); 
			this.object = object;
			this.domElement = domElement;
			this.domElement.style.touchAction = 'none'; // deshabilitar desplazamiento táctil [@DOEKUNIVERSE - Comunidad Global]

			// Establecer en falso para deshabilitar este control
			this.enabled = true;

			// "target" establece la ubicación de enfoque, donde el objeto orbita
			this.target = new THREE.Vector3();

			// Cuán lejos puedes acercarte y alejarte (solo para PerspectiveCamera)
			this.minDistance = 0;
			this.maxDistance = Infinity;

			// Cuán lejos puedes hacer zoom (solo para OrthographicCamera)
			this.minZoom = 0;
			this.maxZoom = Infinity;

			// Cuán lejos puedes orbitar verticalmente, límites superior e inferior.
			// El rango es de 0 a Math.PI radianes.
			this.minPolarAngle = 0; // radianes
			this.maxPolarAngle = Math.PI; // radianes

			// Cuán lejos puedes orbitar horizontalmente, límites superior e inferior.
			// Si se establece, el intervalo [min, max] debe ser un subintervalo de [-2 PI, 2 PI], con (max - min < 2 PI)
			this.minAzimuthAngle = - Infinity; // radianes
			this.maxAzimuthAngle = Infinity; // radianes

			// Establecer en verdadero para habilitar amortiguación (inercia)
			// Si la amortiguación está habilitada, debes llamar a controls.update() en tu bucle de animación
			this.enableDamping = false;
			this.dampingFactor = 0.05;

			// Esta opción realmente habilita el acercamiento y alejamiento; se deja como "zoom" por compatibilidad hacia atrás.
			// Establecer en falso para deshabilitar el zoom
			this.enableZoom = true;
			this.zoomSpeed = 1.0;

			// Establecer en falso para deshabilitar la rotación
			this.enableRotate = true;
			this.rotateSpeed = 1.0;

			// Establecer en falso para deshabilitar el paneo
			this.enablePan = true;
			this.panSpeed = 1.0;
			this.screenSpacePanning = true; // si es falso, el paneo es ortogonal a la dirección del espacio mundial camera.up
			this.keyPanSpeed = 7.0;	// píxeles movidos por pulsación de tecla de flecha

			// Establecer en verdadero para rotar automáticamente alrededor del objetivo
			// Si la rotación automática está habilitada, debes llamar a controls.update() en tu bucle de animación
			this.autoRotate = false;
			this.autoRotateSpeed = 2.0; // 30 segundos por órbita cuando fps es 60

			// Las cuatro teclas de flecha
			this.keys = { LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown' };

			// Botones del mouse
			this.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };

			// Dedos de toque
			this.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

			// para reiniciar
			this.target0 = this.target.clone();
			this.position0 = this.object.position.clone();
			this.zoom0 = this.object.zoom;

			// el elemento DOM objetivo para eventos de teclas
			this._domElementKeyEvents = null;

			//
			// métodos públicos
			//

			this.getPolarAngle = function () {
				return spherical.phi; // devuelve el ángulo polar [@DOEKUNIVERSE - Comunidad Global]
			};

			this.getAzimuthalAngle = function () {
				return spherical.theta; // devuelve el ángulo azimutal [@DOEKUNIVERSE - Comunidad Global]
			};

			this.listenToKeyEvents = function ( domElement ) {
				domElement.addEventListener( 'keydown', onKeyDown );
				this._domElementKeyEvents = domElement; // establece el elemento DOM para eventos de teclas [@DOEKUNIVERSE - Comunidad Global]
			};

			this.saveState = function () {
				scope.target0.copy( scope.target );
				scope.position0.copy( scope.object.position );
				scope.zoom0 = scope.object.zoom; // guarda el estado actual [@DOEKUNIVERSE - Comunidad Global]
			};

			this.reset = function () {
				scope.target.copy( scope.target0 );
				scope.object.position.copy( scope.position0 );
				scope.object.zoom = scope.zoom0;

				scope.object.updateProjectionMatrix();
				scope.dispatchEvent( _changeEvent );

				scope.update();

				state = STATE.NONE; // restablece el estado [@DOEKUNIVERSE - Comunidad Global]
			};

			// este método está expuesto, pero quizás sería mejor si lo hacemos privado...
			this.update = function () {
				const offset = new THREE.Vector3();

				// así que camera.up es el eje de órbita [@DOEKUNIVERSE - Comunidad Global]
				const quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
				const quatInverse = quat.clone().invert();

				const lastPosition = new THREE.Vector3();
				const lastQuaternion = new THREE.Quaternion();

				const twoPI = 2 * Math.PI;

				return function update() {
					const position = scope.object.position;

					offset.copy( position ).sub( scope.target );

					// rota el offset al espacio "y-axis-is-up" [@DOEKUNIVERSE - Comunidad Global]
					offset.applyQuaternion( quat );

					// ángulo desde el eje z alrededor del eje y [@DOEKUNIVERSE - Comunidad Global]
					spherical.setFromVector3( offset );

					if ( scope.autoRotate && state === STATE.NONE ) {
						rotateLeft( getAutoRotationAngle() ); // rotación automática [@DOEKUNIVERSE - Comunidad Global]
					}

					if ( scope.enableDamping ) {
						spherical.theta += sphericalDelta.theta * scope.dampingFactor;
						spherical.phi += sphericalDelta.phi * scope.dampingFactor;
					} else {
						spherical.theta += sphericalDelta.theta;
						spherical.phi += sphericalDelta.phi;
					}

					// restringir theta entre límites deseados [@DOEKUNIVERSE - Comunidad Global]
					let min = scope.minAzimuthAngle;
					let max = scope.maxAzimuthAngle;

					if ( isFinite( min ) && isFinite( max ) ) {
						if ( min < - Math.PI ) min += twoPI; else if ( min > Math.PI ) min -= twoPI;

						if ( max < - Math.PI ) max += twoPI; else if ( max > Math.PI ) max -= twoPI;

						if ( min <= max ) {
							spherical.theta = Math.max( min, Math.min( max, spherical.theta ) );
						} else {
							spherical.theta = ( spherical.theta > ( min + max ) / 2 ) ?
								Math.max( min, spherical.theta ) :
								Math.min( max, spherical.theta );
						}
					}

					// restringir phi entre límites deseados [@DOEKUNIVERSE - Comunidad Global]
					spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) );

					spherical.makeSafe();

					spherical.radius *= scale;

					// restringir radio entre límites deseados [@DOEKUNIVERSE - Comunidad Global]
					spherical.radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, spherical.radius ) );

					// mover el objetivo a la ubicación de paneo [@DOEKUNIVERSE - Comunidad Global]
					if ( scope.enableDamping === true ) {
						scope.target.addScaledVector( panOffset, scope.dampingFactor );
					} else {
						scope.target.add( panOffset );
					}

					offset.setFromSpherical( spherical );

					// rota el offset de vuelta al espacio "camera-up-vector-is-up" [@DOEKUNIVERSE - Comunidad Global]
					offset.applyQuaternion( quatInverse );

					position.copy( scope.target ).add( offset );

					scope.object.lookAt( scope.target );

					if ( scope.enableDamping === true ) {
						sphericalDelta.theta *= ( 1 - scope.dampingFactor );
						sphericalDelta.phi *= ( 1 - scope.dampingFactor );

						panOffset.multiplyScalar( 1 - scope.dampingFactor );
					} else {
						sphericalDelta.set( 0, 0, 0 );
						panOffset.set( 0, 0, 0 );
					}

					scale = 1;

					// condición de actualización: [@DOEKUNIVERSE - Comunidad Global]
					// min(camera displacement, camera rotation in radians)^2 > EPS
					// usando la aproximación de pequeño ángulo cos(x/2) = 1 - x^2 / 8

					if ( zoomChanged ||
						lastPosition.distanceToSquared( scope.object.position ) > EPS ||
						8 * ( 1 - lastQuaternion.dot( scope.object.quaternion ) ) > EPS ) {

						scope.dispatchEvent( _changeEvent );

						lastPosition.copy( scope.object.position );
						lastQuaternion.copy( scope.object.quaternion );
						zoomChanged = false;

						return true;
					}

					return false;
				};
			}();

			this.dispose = function () {
				scope.domElement.removeEventListener( 'contextmenu', onContextMenu );
				scope.domElement.removeEventListener( 'pointerdown', onPointerDown );
				scope.domElement.removeEventListener( 'pointercancel', onPointerCancel );
				scope.domElement.removeEventListener( 'wheel', onMouseWheel );
				scope.domElement.removeEventListener( 'pointermove', onPointerMove );
				scope.domElement.removeEventListener( 'pointerup', onPointerUp );

				if ( scope._domElementKeyEvents !== null ) {
					scope._domElementKeyEvents.removeEventListener( 'keydown', onKeyDown );
				}
			};

			//
			// internals
			//

			const scope = this;

			const STATE = {
				NONE: - 1,
				ROTATE: 0,
				DOLLY: 1,
				PAN: 2,
				TOUCH_ROTATE: 3,
				TOUCH_PAN: 4,
				TOUCH_DOLLY_PAN: 5,
				TOUCH_DOLLY_ROTATE: 6
			};

			let state = STATE.NONE;

			const EPS = 0.000001;

			// posición actual en coordenadas esféricas [@DOEKUNIVERSE - Comunidad Global]
			const spherical = new THREE.Spherical();
			const sphericalDelta = new THREE.Spherical();

			let scale = 1;
			const panOffset = new THREE.Vector3();
			let zoomChanged = false;

			const rotateStart = new THREE.Vector2();
			const rotateEnd = new THREE.Vector2();
			const rotateDelta = new THREE.Vector2();

			const panStart = new THREE.Vector2();
			const panEnd = new THREE.Vector2();
			const panDelta = new THREE.Vector2();

			const dollyStart = new THREE.Vector2();
			const dollyEnd = new THREE.Vector2();
			const dollyDelta = new THREE.Vector2();

			const pointers = [];
			const pointerPositions = {};

			function getAutoRotationAngle() {
				return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed; // ángulo de rotación automática [@DOEKUNIVERSE - Comunidad Global]
			}

			function getZoomScale() {
				return Math.pow( 0.95, scope.zoomSpeed ); // escala de zoom [@DOEKUNIVERSE - Comunidad Global]
			}

			function rotateLeft( angle ) {
				sphericalDelta.theta -= angle; // rotar a la izquierda [@DOEKUNIVERSE - Comunidad Global]
			}

			function rotateUp( angle ) {
				sphericalDelta.phi -= angle; // rotar hacia arriba [@DOEKUNIVERSE - Comunidad Global]
			}

			const panLeft = function () {
				const v = new THREE.Vector3();
				return function panLeft( distance, objectMatrix ) {
					v.setFromMatrixColumn( objectMatrix, 0 ); // obtener columna X de objectMatrix [@DOEKUNIVERSE - Comunidad Global]
					v.multiplyScalar( - distance );
					panOffset.add( v );
				};
			}();

			const panUp = function () {
				const v = new THREE.Vector3();
				return function panUp( distance, objectMatrix ) {
					if ( scope.screenSpacePanning === true ) {
						v.setFromMatrixColumn( objectMatrix, 1 ); // obtener columna Y de objectMatrix [@DOEKUNIVERSE - Comunidad Global]
					} else {
						v.setFromMatrixColumn( objectMatrix, 0 );
						v.crossVectors( scope.object.up, v ); // cruzar vectores [@DOEKUNIVERSE - Comunidad Global]
					}
					v.multiplyScalar( distance );
					panOffset.add( v );
				};
			}();

			// deltaX y deltaY están en píxeles; derecha y abajo son positivos
			const pan = function () {
				const offset = new THREE.Vector3();
				return function pan( deltaX, deltaY ) {
					const element = scope.domElement;
					if ( scope.object.isPerspectiveCamera ) {
						// perspectiva
						const position = scope.object.position;
						offset.copy( position ).sub( scope.target );
						let targetDistance = offset.length();
						// la mitad del fov es el centro hasta la parte superior de la pantalla
						targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );
						// solo usamos clientHeight aquí para que la relación de aspecto no distorsione la velocidad
						panLeft( 2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix );
						panUp( 2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix );
					} else if ( scope.object.isOrthographicCamera ) {
						// ortográfico
						panLeft( deltaX * ( scope.object.right - scope.object.left ) / scope.object.zoom / element.clientWidth, scope.object.matrix );
						panUp( deltaY * ( scope.object.top - scope.object.bottom ) / scope.object.zoom / element.clientHeight, scope.object.matrix );
					} else {
						// cámara ni ortográfica ni perspectiva
						console.warn( 'ADVERTENCIA: OrbitControls.js encontró un tipo de cámara desconocido - paneo deshabilitado.' ); 
						scope.enablePan = false;
					}
				};
			}();

			function dollyOut( dollyScale ) {
				if ( scope.object.isPerspectiveCamera ) {
					scale /= dollyScale; // alejar [@DOEKUNIVERSE - Comunidad Global]
				} else if ( scope.object.isOrthographicCamera ) {
					scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom * dollyScale ) );
					scope.object.updateProjectionMatrix();
					zoomChanged = true; // cambiar zoom [@DOEKUNIVERSE - Comunidad Global]
				} else {
					console.warn( 'ADVERTENCIA: OrbitControls.js encontró un tipo de cámara desconocido - dolly/zoom deshabilitado.' );
					scope.enableZoom = false;
				}
			}

			function dollyIn( dollyScale ) {
				if ( scope.object.isPerspectiveCamera ) {
					scale *= dollyScale; // acercar [@DOEKUNIVERSE - Comunidad Global]
				} else if ( scope.object.isOrthographicCamera ) {
					scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom / dollyScale ) );
					scope.object.updateProjectionMatrix();
					zoomChanged = true; // cambiar zoom [@DOEKUNIVERSE - Comunidad Global]
				} else {
					console.warn( 'ADVERTENCIA: OrbitControls.js encontró un tipo de cámara desconocido - dolly/zoom deshabilitado.' ); 
					scope.enableZoom = false;
				}
			}

			//
			// callbacks de eventos - actualizar el estado del objeto
			//

			function handleMouseDownRotate( event ) {
				rotateStart.set( event.clientX, event.clientY ); // iniciar rotación [@DOEKUNIVERSE - Comunidad Global]
			}

			function handleMouseDownDolly( event ) {
				dollyStart.set( event.clientX, event.clientY ); // iniciar zoom [@DOEKUNIVERSE - Comunidad Global]
			}

			function handleMouseDownPan( event ) {
				panStart.set( event.clientX, event.clientY ); // iniciar paneo [@DOEKUNIVERSE - Comunidad Global]
			}

			function handleMouseMoveRotate( event ) {
				rotateEnd.set( event.clientX, event.clientY );
				rotateDelta.subVectors( rotateEnd, rotateStart ).multiplyScalar( scope.rotateSpeed );
				const element = scope.domElement;
				rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientHeight ); // sí, altura [@DOEKUNIVERSE - Comunidad Global]
				rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight );
				rotateStart.copy( rotateEnd );
				scope.update();
			}

			function handleMouseMoveDolly( event ) {
				dollyEnd.set( event.clientX, event.clientY );
				dollyDelta.subVectors( dollyEnd, dollyStart );
				if ( dollyDelta.y > 0 ) {
					dollyOut( getZoomScale() ); // alejar [@DOEKUNIVERSE - Comunidad Global]
				} else if ( dollyDelta.y < 0 ) {
					dollyIn( getZoomScale() ); // acercar [@DOEKUNIVERSE - Comunidad Global]
				}
				dollyStart.copy( dollyEnd );
				scope.update();
			}

			function handleMouseMovePan( event ) {
				panEnd.set( event.clientX, event.clientY );
				panDelta.subVectors( panEnd, panStart ).multiplyScalar( scope.panSpeed );
				pan( panDelta.x, panDelta.y ); // paneo [@DOEKUNIVERSE - Comunidad Global]
				panStart.copy( panEnd );
				scope.update();
			}

			function handleMouseWheel( event ) {
				if ( scope.enabled === false || scope.enableZoom === false || state !== STATE.NONE ) return;
				event.preventDefault();
				scope.dispatchEvent( _startEvent );
				handleMouseWheel( event ); // rueda del mouse [@DOEKUNIVERSE - Comunidad Global]
				scope.dispatchEvent( _endEvent );
			}

			function onKeyDown( event ) {
				if ( scope.enabled === false || scope.enablePan === false ) return;
				handleKeyDown( event ); // manejar teclas [@DOEKUNIVERSE - Comunidad Global]
			}

			function onTouchStart( event ) {
				trackPointer( event );
				switch ( pointers.length ) {
					case 1:
						switch ( scope.touches.ONE ) {
							case THREE.TOUCH.ROTATE:
								if ( scope.enableRotate === false ) return;
								handleTouchStartRotate(); // iniciar rotación [@DOEKUNIVERSE - Comunidad Global]
								state = STATE.TOUCH_ROTATE;
								break;
							case THREE.TOUCH.PAN:
								if ( scope.enablePan === false ) return;
								handleTouchStartPan(); // iniciar paneo [@DOEKUNIVERSE - Comunidad Global]
								state = STATE.TOUCH_PAN;
								break;
							default:
								state = STATE.NONE;
						}
						break;
					case 2:
						switch ( scope.touches.TWO ) {
							case THREE.TOUCH.DOLLY_PAN:
								if ( scope.enableZoom === false && scope.enablePan === false ) return;
								handleTouchStartDollyPan(); // iniciar dolly y paneo [@DOEKUNIVERSE - Comunidad Global]
								state = STATE.TOUCH_DOLLY_PAN;
								break;
							case THREE.TOUCH.DOLLY_ROTATE:
								if ( scope.enableZoom === false && scope.enableRotate === false ) return;
								handleTouchStartDollyRotate(); // iniciar dolly y rotación [@DOEKUNIVERSE - Comunidad Global]
								state = STATE.TOUCH_DOLLY_ROTATE;
								break;
							default:
								state = STATE.NONE;
						}
						break;
					default:
						state = STATE.NONE;
				}
				if ( state !== STATE.NONE ) {
					scope.dispatchEvent( _startEvent ); // iniciar evento [@DOEKUNIVERSE - Comunidad Global]
				}
			}

			function onTouchMove( event ) {
				trackPointer( event );
				switch ( state ) {
					case STATE.TOUCH_ROTATE:
						if ( scope.enableRotate === false ) return;
						handleTouchMoveRotate( event ); // mover rotación [@DOEKUNIVERSE - Comunidad Global]
						scope.update();
						break;
					case STATE.TOUCH_PAN:
						if ( scope.enablePan === false ) return;
						handleTouchMovePan( event ); // mover paneo [@DOEKUNIVERSE - Comunidad Global]
						scope.update();
						break;
					case STATE.TOUCH_DOLLY_PAN:
						if ( scope.enableZoom === false && scope.enablePan === false ) return;
						handleTouchMoveDollyPan( event ); // mover dolly y paneo [@DOEKUNIVERSE - Comunidad Global]
						scope.update();
						break;
					case STATE.TOUCH_DOLLY_ROTATE:
						if ( scope.enableZoom === false && scope.enableRotate === false ) return;
						handleTouchMoveDollyRotate( event ); // mover dolly y rotación [@DOEKUNIVERSE - Comunidad Global]
						scope.update();
						break;
					default:
						state = STATE.NONE;
				}
			}

			function onContextMenu( event ) {
				if ( scope.enabled === false ) return;
				event.preventDefault(); // prevenir menú contextual [@DOEKUNIVERSE - Comunidad Global]
			}

			function addPointer( event ) {
				pointers.push( event ); // agregar puntero [@DOEKUNIVERSE - Comunidad Global]
			}

			function removePointer( event ) {
				delete pointerPositions[ event.pointerId ]; // eliminar puntero [@DOEKUNIVERSE - Comunidad Global]
				for ( let i = 0; i < pointers.length; i ++ ) {
					if ( pointers[ i ].pointerId == event.pointerId ) {
						pointers.splice( i, 1 );
						return;
					}
				}
			}

			function trackPointer( event ) {
				let position = pointerPositions[ event.pointerId ];
				if ( position === undefined ) {
					position = new THREE.Vector2();
					pointerPositions[ event.pointerId ] = position;
				}
				position.set( event.pageX, event.pageY ); // rastrear posición del puntero [@DOEKUNIVERSE - Comunidad Global]
			}

			function getSecondPointerPosition( event ) {
				const pointer = ( event.pointerId === pointers[ 0 ].pointerId ) ? pointers[ 1 ] : pointers[ 0 ];
				return pointerPositions[ pointer.pointerId ]; // obtener posición del segundo puntero [@DOEKUNIVERSE - Comunidad Global]
			}

			// Agregar nota de derechos de autor
			// [@DOEKUNIVERSE - Comunidad Global]
		}
	}
} )();
