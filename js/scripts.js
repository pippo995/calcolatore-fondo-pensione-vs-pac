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

    // Inizializza tooltip mobile
    setupMobileTooltips();
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

/**
 * Inizializza il sistema di help modale per le label
 */
function setupMobileTooltips() {
    // Definizione help content
    const helpContent = {
        reddito: {
            title: 'Il tuo stipendio lordo',
            text: 'Serve per calcolare quanto risparmi di tasse versando nel FP e quanto versa il datore di lavoro.'
        },
        durata: {
            title: 'Durata simulazione',
            text: 'Per quanti anni vuoi vedere l\'evoluzione dell\'investimento. Più è lunga, più si vedono gli effetti dell\'interesse composto.'
        },
        investimento: {
            title: 'Quanto vuoi investire',
            text: 'L\'importo che vuoi investire. In modalità cumulativa, è l\'importo versato ogni anno.'
        },
        contribuzioneDatoreFpPerc: {
            title: 'Soldi gratis dall\'azienda',
            text: 'Percentuale del tuo reddito che l\'azienda versa nel tuo FP. Controlla il tuo contratto o chiedi all\'HR.'
        },
        quotaMinAderentePerc: {
            title: 'Quanto devi versare tu',
            text: 'Percentuale minima del tuo reddito che devi versare per sbloccare il contributo del datore.'
        },
        compartoFp: {
            title: 'Tipo di comparto',
            text: 'Determina il rendimento atteso. I rendimenti sono già al netto della tassazione annuale (12.5-20%) come pubblicati da COVIP.'
        },
        etfPreset: {
            title: 'Tipo di ETF',
            text: 'Seleziona un ETF comune o inserisci un rendimento personalizzato. Rendimenti basati su medie storiche ~10 anni.'
        },
        rendimentoAnnualeFpPerc: {
            title: 'Quanto rende il FP',
            text: 'Rendimento annuo atteso del fondo pensione. Dati storici COVIP: 3-5% per fondi bilanciati.'
        },
        rendimentoAnnualePacPerc: {
            title: 'Quanto rendono gli ETF',
            text: 'Rendimento annuo atteso degli ETF. L\'MSCI World ha reso storicamente ~7-8%.'
        },
        modalitaCumulativa: {
            title: 'Modalità cumulativa',
            text: 'Sì: versi la quota ogni anno e vedi l\'accumulo totale.\nNo: vedi l\'evoluzione di un singolo versamento nel tempo.'
        },
        reinvestiRisparmio: {
            title: 'Reinvesti risparmio fiscale',
            text: 'Sì: il risparmio IRPEF viene reinvestito nel FP l\'anno dopo.\nNo: tenuto da parte e sommato alla fine.'
        },
        riscattoAnticipato: {
            title: 'Riscatto totale anticipato',
            text: 'Sì: i versamenti FP saranno tassati al 23% fisso.\nNo: tassazione normale 15% → 9%.'
        },
        mostraDettaglio: {
            title: 'Dettaglio tabella',
            text: 'Sì: mostra tutte le colonne nella tabella.\nNo: mostra solo Anno e i valori Exit.'
        }
    };

    // Crea modal
    const modal = document.createElement('div');
    modal.className = 'help-modal';
    modal.innerHTML = `
        <div class="help-modal-backdrop"></div>
        <div class="help-modal-content">
            <button class="help-modal-close">×</button>
            <div class="help-modal-title"></div>
            <div class="help-modal-text"></div>
        </div>
    `;
    document.body.appendChild(modal);

    const modalTitle = modal.querySelector('.help-modal-title');
    const modalText = modal.querySelector('.help-modal-text');

    function closeModal() {
        modal.classList.remove('active');
    }

    function openModal(helpId) {
        const help = helpContent[helpId];
        if (!help) return;

        modalTitle.textContent = help.title;
        modalText.textContent = help.text;
        modal.classList.add('active');
    }

    // Click su label con data-help
    document.querySelectorAll('label[data-help]').forEach(label => {
        label.addEventListener('click', function(e) {
            e.preventDefault();
            const helpId = this.getAttribute('data-help');
            openModal(helpId);
        });
    });

    // Chiudi modal
    modal.querySelector('.help-modal-close').addEventListener('click', closeModal);
    modal.querySelector('.help-modal-backdrop').addEventListener('click', closeModal);

    // Chiudi con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
}
