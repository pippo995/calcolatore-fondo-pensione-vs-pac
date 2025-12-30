/**
 * Calcolatore Fondo Pensione vs PAC - Scripts
 * Versione Dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inizializza il toggle della modalità scura
    setupDarkMode();

    // Inizializza la navigazione a tab
    setupTabs();

    // Inizializza i comportamenti di scrolling
    setupScrolling();

    // Inizializza toggle risultati
    setupResultsToggle();
});

/**
 * Inizializza il toggle per mostrare/nascondere la tabella risultati
 */
function setupResultsToggle() {
    // Toggle tabella
    const toggleResults = document.getElementById('toggle-results');
    const resultsSection = toggleResults?.closest('.results-section');

    if (toggleResults && resultsSection) {
        toggleResults.addEventListener('click', function() {
            resultsSection.classList.toggle('collapsed');
        });
    }

    // Toggle grafico
    const toggleChart = document.getElementById('toggle-chart');
    const chartSection = toggleChart?.closest('.chart-section');

    if (toggleChart && chartSection) {
        toggleChart.addEventListener('click', function() {
            chartSection.classList.toggle('collapsed');
        });
    }
}

/**
 * Inizializza la funzionalità di toggle della modalità scura
 */
function setupDarkMode() {
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    // Controlla la preferenza del tema salvata o quella di sistema
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        html.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } else if (systemPrefersDark) {
        html.setAttribute('data-theme', 'dark');
        updateThemeIcon('dark');
    }

    // Cambia tema al click del pulsante
    themeToggle.addEventListener('click', function() {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

/**
 * Aggiorna l'icona del pulsante di toggle del tema
 */
function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('i');

    if (theme === 'dark') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

/**
 * Inizializza la navigazione a tab
 */
function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Rimuovi la classe active da tutti i tab
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            // Aggiungi la classe active al tab cliccato
            this.classList.add('active');

            // Nascondi tutti i contenuti dei tab
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            // Mostra il contenuto corrispondente
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-content`).classList.add('active');
        });
    });
}

/**
 * Inizializza lo scrolling fluido per i link della documentazione e il pulsante torna-su
 */
function setupScrolling() {
    // Scrolling fluido per i link della documentazione
    document.querySelectorAll('.docs-nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 20,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Pulsante torna in alto
    const goToTopButton = document.getElementById('go-to-top');

    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            goToTopButton.classList.add('visible');
        } else {
            goToTopButton.classList.remove('visible');
        }
    });

    goToTopButton.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * Funzione helper per il download CSV
 * Chiamata dal modulo app.js
 */
function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);

    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
