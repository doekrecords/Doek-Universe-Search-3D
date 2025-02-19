document.addEventListener('DOMContentLoaded', () => {
    // Efectos de hover en la navegación [@DOEKUNIVERSE - Comunidad Global]
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('mouseenter', () => {
            link.style.textShadow = '0 0 10px var(--accent-color)';
        });
        
        link.addEventListener('mouseleave', () => {
            link.style.textShadow = 'none';
        });

        // Manejar clicks en la navegación [@DOEKUNIVERSE - Comunidad Global]
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            if (window.universe) {
                const planet = window.universe.planets.find(p => p.section === section);
                if (planet) {
                    window.universe.focusPlanet(planet);
                    window.universe.showInfo(section);
                }
            }
        });
    });

    // Efectos de hover en el panel de información [@DOEKUNIVERSE - Comunidad Global]
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel) {
        infoPanel.addEventListener('mouseenter', () => {
            infoPanel.style.transform = 'scale(1.02)';
            infoPanel.style.boxShadow = '0 0 30px rgba(76, 201, 240, 0.3)';
        });

        infoPanel.addEventListener('mouseleave', () => {
            infoPanel.style.transform = 'scale(1)';
            infoPanel.style.boxShadow = '0 0 20px rgba(76, 201, 240, 0.3)';
        });
    }

    // Efecto de click en elementos code [@DOEKUNIVERSE - Comunidad Global]
    document.querySelectorAll('code').forEach(codeBlock => {
        codeBlock.addEventListener('click', () => {
            const text = codeBlock.textContent;
            navigator.clipboard.writeText(text).then(() => {
                const originalText = codeBlock.textContent;
                codeBlock.textContent = '¡Copiado!';
                codeBlock.style.background = 'rgba(67, 97, 238, 0.3)';
                
                setTimeout(() => {
                    codeBlock.textContent = originalText;
                    codeBlock.style.background = 'rgba(0, 0, 0, 0.3)';
                }, 1000);
            });
        });
    });

    // Animación suave al mostrar el panel de información [@DOEKUNIVERSE - Comunidad Global]
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    // Observar elementos para animaciones [@DOEKUNIVERSE - Comunidad Global]
    document.querySelectorAll('.panel-content > *').forEach(el => {
        observer.observe(el);
    });
});
