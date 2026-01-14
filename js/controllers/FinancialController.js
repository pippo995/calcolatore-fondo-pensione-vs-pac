import { FinancialModel } from '../models/FinancialModel.js';
import { FinancialView } from '../views/FinancialView.js';
import { COMPARTI_FP, ETF_PRESETS } from '../constants/financial-constants.js';

/**
 * FinancialController - Gestisce gli eventi e collega model e view
 */
export class FinancialController {
    constructor() {
        this.model = new FinancialModel();
        this.view = new FinancialView();
        this.initEventListeners();
      }
  
    /**
     * Inizializza tutti gli event listener
     */
    initEventListeners() {
      document.getElementById('input-form').addEventListener('input', () => this.updateResults());
      document.getElementById('input-form').addEventListener('change', () => this.updateResults()); // Per checkbox
      document.getElementById("download-csv").addEventListener("click", () => this.downloadCsv());

      // Listener per cambio comparto FP
      document.getElementById('compartoFp').addEventListener('change', (e) => {
        const comparto = COMPARTI_FP[e.target.value];
        const rendimentoFpInput = document.getElementById('rendimentoAnnualeFpPerc');
        if (comparto) {
          if (e.target.value === 'custom') {
            rendimentoFpInput.disabled = false;
          } else {
            rendimentoFpInput.value = comparto.rendimentoDefault;
            rendimentoFpInput.disabled = true;
          }
          this.updateResults();
        }
      });

      // Listener per cambio ETF preset
      document.getElementById('etfPreset').addEventListener('change', (e) => {
        const etf = ETF_PRESETS[e.target.value];
        const rendimentoPacInput = document.getElementById('rendimentoAnnualePacPerc');
        if (etf) {
          if (e.target.value === 'custom') {
            rendimentoPacInput.disabled = false;
          } else {
            rendimentoPacInput.value = etf.rendimentoDefault;
            rendimentoPacInput.disabled = true;
          }
          this.updateResults();
        }
      });

      // Imposta lo stato iniziale dei campi rendimento (bloccati perché i default non sono "custom")
      document.getElementById('rendimentoAnnualeFpPerc').disabled = true;
      document.getElementById('rendimentoAnnualePacPerc').disabled = true;
    }
  
    /**
     * Funzione principale di calcolo che raccoglie gli input e aggiorna i risultati
     */
    updateResults() {
      // Raccogli tutti i valori di input
      const config = {
        durata: parseInt(document.getElementById('durata').value),
        reddito: parseFloat(document.getElementById('reddito').value),
        investimento: parseFloat(document.getElementById('investimento').value),

        // Percentuali contributi
        quotaDatoreFpPerc: parseFloat(document.getElementById('contribuzioneDatoreFpPerc').value) / 100,
        quotaMinAderentePerc: parseFloat(document.getElementById('quotaMinAderentePerc').value) / 100,

        // Tassi di rendimento
        rendimentoAnnualeFpPerc: parseFloat(document.getElementById('rendimentoAnnualeFpPerc').value) / 100,
        rendimentoAnnualePacPerc: parseFloat(document.getElementById('rendimentoAnnualePacPerc').value) / 100,

        // Opzioni di calcolo
        reinvestiRisparmio: document.getElementById('reinvestiRisparmio').checked,
        modalitaCumulativa: document.getElementById('modalitaCumulativa').checked,
        riscattoAnticipato: document.getElementById('riscattoAnticipato').checked,
        mostraDettaglio: document.getElementById('mostraDettaglio').checked
      };
  
      // Calcola i risultati usando il model
      const results = this.model.calculateResults(config);
      
      // Aggiorna la view
      this.view.createTable(results.results, config.mostraDettaglio);
      this.view.updateStrategyText(results.strategyText);
      this.view.updateMetricsDashboard(results.results);
      this.view.updateBreakeven(results.breakeven);
      this.view.updateChart(results.results);

      // Aggiorna la visualizzazione dell'investimento minimo
      this.updateMinInvestimentoDisplay(config.reddito, config.quotaMinAderentePerc);

      // Aggiorna il contenuto CSV per il download
      this.csvContent = this.model.convertToCSV(results.results);
    }

    /**
     * Aggiorna la visualizzazione dell'investimento minimo
     */
    updateMinInvestimentoDisplay(reddito, quotaMinAderentePerc) {
      const minInvestimento = Math.round(reddito * quotaMinAderentePerc);
      const display = document.getElementById('min-investimento-display');
      if (display) {
        display.textContent = minInvestimento.toLocaleString('it-IT') + ' €';
      }
    }

    /**
     * Scarica i dati in formato CSV
     */
    downloadCsv() {
      const blob = new Blob([this.csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", "data.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }