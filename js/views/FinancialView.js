/**
 * FinancialView - Gestisce tutto il rendering dell'interfaccia
 */
export class FinancialView {
    constructor() {
        this.chart = null;
    }
    /**
     * Aggiorna il dashboard delle metriche con i valori di exit finali
     * @param {Array} results - Risultati dei calcoli
     */
    updateMetricsDashboard(results) {
      if (!results.length) return;

      // Ottieni l'ultima riga (risultati dell'anno finale)
      const lastResult = results[results.length - 1];

      // Estrai i valori di exit
      const exitFP = lastResult['Exit FP'] || 0;
      const exitPAC = lastResult['Exit PAC'] || 0;
      const exitMix = lastResult['Exit Mix'] || 0;

      // Aggiorna le card delle metriche
      document.getElementById('metric-fp-value').textContent = this.formatMoney(exitFP);
      document.getElementById('metric-pac-value').textContent = this.formatMoney(exitPAC);
      document.getElementById('metric-mix-value').textContent = this.formatMoney(exitMix);

      // Trova la strategia migliore
      const values = [
        { id: 'fp', value: exitFP, card: document.querySelector('.metric-card.metric-fp') },
        { id: 'pac', value: exitPAC, card: document.querySelector('.metric-card.metric-pac') },
        { id: 'mix', value: exitMix, card: document.querySelector('.metric-card.metric-mix') }
      ];

      // Rimuovi la classe 'best' da tutte le card
      values.forEach(v => {
        if (v.card) v.card.classList.remove('best');
      });

      // Trova e evidenzia la migliore
      const best = values.reduce((a, b) => a.value > b.value ? a : b);
      if (best.card) {
        best.card.classList.add('best');

        // Mostra il badge sulla card migliore
        document.querySelectorAll('.metric-badge').forEach(b => b.style.display = 'none');
        const bestBadge = best.card.querySelector('.metric-badge');
        if (bestBadge) {
          bestBadge.style.display = 'block';
        }
      }
    }

    /**
     * Crea una tabella dei risultati e la renderizza
     * @param {Array} results - Risultati dei calcoli
     * @param {boolean} mostraDettaglio - Se mostrare tutte le colonne o solo Anno e Exit
     */
    createTable(results, mostraDettaglio = true) {
      if (!results.length) return;

      // Colonne da mostrare in modalità semplificata
      const colonneBase = ['Anno', 'Exit FP', 'Exit PAC', 'Exit Mix'];

      const rows = results.map(result => {
        return Object.entries(result)
          .filter(([key]) => mostraDettaglio || colonneBase.includes(key))
          .map(([key, value]) => {
            if (key !== "Anno") {
              value = this.formatMoney(value);
            }
            return [key, value];
          });
      }).map(entryArray => Object.fromEntries(entryArray));

      const table = document.createElement('table');
      table.id = 'output-table';

      // Crea l'header della tabella
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      for (const key in rows[0]) {
        const headerCell = document.createElement('th');
        headerCell.textContent = key;
        headerRow.appendChild(headerCell);
      }
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Crea il body della tabella
      const tbody = document.createElement('tbody');
      rows.forEach(row => {
        const newRow = document.createElement('tr');
        for (const key in row) {
          const cell = document.createElement('td');
          cell.textContent = row[key];
          newRow.appendChild(cell);
        }
        tbody.appendChild(newRow);
      });
      table.appendChild(tbody);

      // Sostituisci la tabella esistente
      const griddiv = document.getElementById("grid-div");
      while (griddiv.firstChild) {
        griddiv.removeChild(griddiv.firstChild);
      }
      griddiv.appendChild(table);
    }

    /**
     * Aggiorna il testo della strategia nell'interfaccia (rimosso)
     * @param {string} text - Descrizione della strategia
     */
    updateStrategyText(text) {
      // Card rimossa - funzione mantenuta per compatibilità
    }

    /**
     * Aggiorna la visualizzazione del breakeven
     * @param {number|null} breakeven - Anno di breakeven o null
     */
    updateBreakeven(breakeven) {
      const element = document.getElementById('metric-breakeven-value');
      if (element) {
        if (breakeven) {
          element.textContent = `> ${breakeven} anni`;
        } else {
          element.textContent = 'Mai';
        }
      }
    }

    /**
     * Formatta i valori monetari con separatori delle migliaia e simbolo valuta
     * @param {number} number - Importo da formattare
     * @returns {string} Stringa formattata con valuta
     */
    formatMoney(number) {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " €";
    }

    /**
     * Aggiorna il grafico con i dati dei risultati
     * @param {Array} results - Risultati dei calcoli
     */
    updateChart(results) {
      if (!results.length) return;

      const ctx = document.getElementById('results-chart');
      if (!ctx) return;

      // Estrai i dati per il grafico
      const labels = results.map(r => `Anno ${r['Anno']}`);
      const exitFP = results.map(r => r['Exit FP'] || 0);
      const exitPAC = results.map(r => r['Exit PAC'] || 0);
      const exitMix = results.map(r => r['Exit Mix'] || 0);

      // Colori
      const colors = {
        fp: '#3b82f6',    // blu
        pac: '#10b981',   // verde
        mix: '#f59e0b'    // arancione
      };

      // Distruggi il grafico esistente se presente
      if (this.chart) {
        this.chart.destroy();
      }

      // Crea il nuovo grafico
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Exit FP',
              data: exitFP,
              borderColor: colors.fp,
              backgroundColor: colors.fp + '20',
              tension: 0.3,
              fill: false
            },
            {
              label: 'Exit PAC',
              data: exitPAC,
              borderColor: colors.pac,
              backgroundColor: colors.pac + '20',
              tension: 0.3,
              fill: false
            },
            {
              label: 'Exit Mix',
              data: exitMix,
              borderColor: colors.mix,
              backgroundColor: colors.mix + '20',
              tension: 0.3,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          layout: {
            padding: {
              top: 10
            }
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 20,
                boxWidth: 8,
                boxHeight: 8
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': ' +
                    context.raw.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ' €';
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ' €';
                }
              }
            }
          }
        }
      });
    }
  }
