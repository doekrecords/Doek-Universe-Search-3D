import { THREE, particleSystem } from '../core/init.js';
import { CelestialManager } from '../universe/celestial.js';

export class SearchManager {
    constructor() {
        this.searchInput = document.getElementById('search-input');
        this.searchButton = document.getElementById('search-button');
        this.currentResults = [];
        this.isSearching = false;
        this.celestialManager = new CelestialManager();
        this.particleSystem = particleSystem;

        // Sistema de caché
        this.searchCache = new Map();
        this.CACHE_DURATION = 1000 * 60 * 30; // 30 minutos

        // Configuración de la API de DuckDuckGo
        this.API_URL = 'https://api.duckduckgo.com/';
        this.MAX_RESULTS = 100; // Aumentar el límite de resultados

        // Vincular eventos
        this.bindEvents();
        
        console.log('SearchManager initialized with DuckDuckGo API');
    }

    bindEvents() {
        this.searchButton.addEventListener('click', () => {
            console.log('Search button clicked');
            this.performSearch();
        });
        
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                console.log('Enter key pressed');
                this.performSearch();
            }
        });
    }

    // Debounce para mejorar rendimiento
    #searchDebounceTimeout = null;
    #lastQuery = '';

    async performSearch() {
        if (this.isSearching) {
            console.log('Search already in progress');
            return;
        }
        
        const query = this.searchInput.value.trim();
        if (!query) {
            console.log('Empty query');
            return;
        }

        // Evitar búsquedas duplicadas
        if (query === this.#lastQuery) {
            console.log('Duplicate search prevented');
            return;
        }

        // Debounce mejorado
        if (this.#searchDebounceTimeout) {
            clearTimeout(this.#searchDebounceTimeout);
        }

        this.#searchDebounceTimeout = setTimeout(() => {
            this.#lastQuery = query;
            this.executeSearch(query);
        }, 200); // Reducido a 200ms para mejor respuesta
    }

    async executeSearch(query) {

        // Verificar caché
        const cachedResult = this.checkCache(query);
        if (cachedResult) {
            console.log('Usando resultados en caché para:', query);
            await this.handleSearchResults(cachedResult);
            return;
        }

        console.log('Performing search for:', query);
        this.isSearching = true;
        this.searchButton.disabled = true;
        
        try {
            // Efecto de inicio de búsqueda
            this.particleSystem.createExplosionEffect(
                new THREE.Vector3(0, 0, -20),
                0x4361EE
            );

            const results = await this.fetchDuckDuckGoResults(query);
            console.log('DuckDuckGo API response:', results);

            if (results && results.RelatedTopics) {
                // Procesar y guardar en caché
                this.currentResults = this.processDuckDuckGoResults(results);
                this.saveToCache(query, this.currentResults);
                await this.handleSearchResults(this.currentResults);
            }
            
        } catch (error) {
            console.error('Error en la búsqueda:', error);
            // Efecto de error
            this.particleSystem.createExplosionEffect(
                new THREE.Vector3(0, 0, -20),
                0xFF0000
            );
        } finally {
            this.isSearching = false;
            this.searchButton.disabled = false;
        }
    }

    async fetchDuckDuckGoResults(query) {
        const params = new URLSearchParams({
            q: query,
            format: 'json',
            pretty: 1,
            no_html: 1,
            skip_disambig: 1,
            t: 'doekUniverse',
            callback: 'callback'
        });

        try {
            // Usar JSONP para evitar problemas de CORS
            const url = `${this.API_URL}?${params}`;
            console.log('Fetching from DuckDuckGo:', url);
            
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                const callbackName = 'ddg_' + Math.random().toString(36).substr(2, 9);
                
                window[callbackName] = (data) => {
                    delete window[callbackName];
                    document.body.removeChild(script);
                    resolve(data);
                };

                script.src = `${url}&callback=${callbackName}`;
                script.onerror = () => {
                    delete window[callbackName];
                    document.body.removeChild(script);
                    reject(new Error('Failed to load DuckDuckGo results'));
                };

                document.body.appendChild(script);
            });
            
        } catch (error) {
            console.error('Fetch error:', error);
            throw new Error('Error al obtener resultados: ' + error.message);
        }
    }

    processDuckDuckGoResults(apiResponse) {
        console.log('Processing DuckDuckGo results:', apiResponse);
        const processed = [];

        // Procesar resultado abstracto principal
        if (apiResponse.AbstractText) {
            processed.push({
                title: apiResponse.Heading || apiResponse.AbstractTitle || 'Resultado Principal',
                url: apiResponse.AbstractURL,
                description: apiResponse.AbstractText,
                type: 'abstract',
                relevance: 1.0,
                source: apiResponse.AbstractSource || 'DuckDuckGo'
            });
        }

        // Procesar resultados relacionados
        if (apiResponse.RelatedTopics && Array.isArray(apiResponse.RelatedTopics)) {
            apiResponse.RelatedTopics.forEach((topic, index) => {
                // Aumentar el límite de resultados procesados
                if (processed.length >= this.MAX_RESULTS) return;

                if (topic.Topics) {
                    topic.Topics.forEach((subtopic, subIndex) => {
                        // Aumentar el límite de resultados procesados
                        if (processed.length >= this.MAX_RESULTS) return;
                        processed.push({
                            title: this.extractTitle(subtopic.Text),
                            url: subtopic.FirstURL,
                            description: subtopic.Text,
                            type: 'subtopic',
                            relevance: Math.max(0.3, 0.8 - (index * 0.1)),
                            source: 'DuckDuckGo',
                            icon: subtopic.Icon?.URL
                        });
                    });
                } else if (topic.Text && topic.FirstURL) {
                    processed.push({
                        title: this.extractTitle(topic.Text),
                        url: topic.FirstURL,
                        description: topic.Text,
                        type: 'topic',
                        relevance: Math.max(0.4, 0.9 - (index * 0.1)),
                        source: 'DuckDuckGo',
                        icon: topic.Icon?.URL
                    });
                }
            });
        }

        console.log(`Processed ${processed.length} results`);
        return processed;
    }

    extractTitle(text) {
        if (!text) return 'Sin título';
        
        const separators = [' - ', ' – ', ': ', '. '];
        for (const separator of separators) {
            const parts = text.split(separator);
            if (parts.length > 1) {
                return parts[0].trim();
            }
        }

        const words = text.split(' ');
        if (words.length > 5) {
            return words.slice(0, 5).join(' ') + '...';
        }
        return text;
    }

    getCurrentResults() {
        return this.currentResults;
    }

    clearResults() {
        this.currentResults = [];
        this.celestialManager.clearCurrentResults();
    }

    // Métodos de caché
    checkCache(query) {
        const cached = this.searchCache.get(query);
        if (!cached) return null;

        const { timestamp, results } = cached;
        const now = Date.now();

        // Verificar si el caché ha expirado
        if (now - timestamp > this.CACHE_DURATION) {
            this.searchCache.delete(query);
            return null;
        }

        return results;
    }

    saveToCache(query, results) {
        this.searchCache.set(query, {
            timestamp: Date.now(),
            results: results
        });

        // Limitar el tamaño del caché a 50 entradas
        if (this.searchCache.size > 50) {
            const oldestKey = this.searchCache.keys().next().value;
            this.searchCache.delete(oldestKey);
        }
    }

    async handleSearchResults(results) {
        // Limitar el número de resultados para mejor rendimiento
        const maxVisibleResults = 20;
        this.currentResults = results.slice(0, maxVisibleResults);
        
        console.log(`Showing ${this.currentResults.length} of ${results.length} results`);
        
        if (this.currentResults.length > 0) {
            // Actualizar visualización de forma asíncrona
            requestAnimationFrame(async () => {
                await this.celestialManager.updateUniverse(this.currentResults);
                
                // Efecto de búsqueda exitosa después de la actualización
                requestAnimationFrame(() => {
                    this.particleSystem.createExplosionEffect(
                        new THREE.Vector3(0, 0, -20),
                        0x9D4EDD
                    );
                });
            });
        } else {
            console.log('No results found');
            // Efecto de búsqueda sin resultados
            requestAnimationFrame(() => {
                this.particleSystem.createExplosionEffect(
                    new THREE.Vector3(0, 0, -20),
                    0xFFA500
                );
            });
        }
    }
}
