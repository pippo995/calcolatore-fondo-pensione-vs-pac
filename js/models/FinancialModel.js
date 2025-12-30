import { FINANCIAL_CONSTANTS } from '../constants/financial-constants.js';

/**
 * FinancialModel - Contiene tutta la logica di business e i calcoli
 * Calcola l'evoluzione di un singolo investimento nel tempo
 */
export class FinancialModel {
    constructor() {
      this.csvContent = "data:text/csv;charset=utf-8,";
    }

    /**
     * Calcola tutti gli scenari finanziari basati sui parametri di input
     * Supporta 4 combinazioni: singolo/cumulativo x reinvesti/non-reinvesti
     * @param {Object} config - Oggetto di configurazione con tutti i parametri
     * @returns {Object} Risultati e informazioni sulla strategia
     */
    calculateResults(config) {
      const {
        durata, reddito, investimento,
        quotaDatoreFpPerc, quotaMinAderentePerc,
        rendimentoAnnualeFpPerc, rendimentoAnnualePacPerc,
        reinvestiRisparmio, modalitaCumulativa, riscattoAnticipato
      } = config;

      const results = [];

      // Calcoli base
      const quotaMinAderente = reddito * quotaMinAderentePerc;
      const quotaDatoreFp = investimento >= quotaMinAderente ? reddito * quotaDatoreFpPerc : 0;
      const limiteDeduzione = Math.max(FINANCIAL_CONSTANTS.LIMITE_DEDUZIONE_FP - quotaDatoreFp, 0);

      const rFP = rendimentoAnnualeFpPerc;
      const rPAC = rendimentoAnnualePacPerc;

      // Variabili di stato per la simulazione anno per anno
      let montanteFP = 0;
      let montantePAC = 0;
      let montanteFPMix = 0;
      let montantePACMix = 0;
      let investimentoTotalePAC = 0;
      let investimentoTotalePACMix = 0;
      let risparmioAccumulato = 0;
      let contributoAderenteTotale = 0;
      let contributoDatoreTotale = 0;

      // Risparmio fiscale dell'anno PRECEDENTE (disponibile per reinvestimento quest'anno)
      let risparmioDaReinvestire = 0;

      // Quote per l'anno corrente (non cumulate - sono caratteristiche dell'investimento annuale)
      let quotaEntroMinAnno = 0;
      let quotaExtraMinAnno = 0;
      let quotaEntroDedAnno = 0;
      let quotaExtraDedAnno = 0;

      for (let anno = 1; anno <= durata; anno++) {
        // Calcola il risparmio fiscale base di quest'anno (solo sull'investimento base)
        const risparmioAnnoBase = this._calculateTaxSavings(reddito, investimento, quotaDatoreFp);

        // Il contributo di quest'anno dipende dalla modalità
        let contributoFpAnno, contributoPacAnno;
        let contributoFpMixAnno, contributoPacMixAnno;
        let risparmioAnnoEffettivo;
        let investimentoEffettivoAnno; // Investimento incluso il risparmio reinvestito
        let aderenteAnno = 0; // Contributo aderente di quest'anno
        let datoreAnno = 0; // Contributo datore di quest'anno

        if (modalitaCumulativa) {
          // MODALITÀ CUMULATIVA: investi ogni anno
          if (reinvestiRisparmio) {
            // Anno 1: solo investimento base (nessun risparmio precedente)
            // Anno 2+: investimento base + risparmio fiscale dell'anno precedente
            investimentoEffettivoAnno = investimento + risparmioDaReinvestire;
            contributoFpAnno = investimentoEffettivoAnno + quotaDatoreFp;

            // Calcola il risparmio fiscale generato QUEST'ANNO (disponibile l'anno prossimo)
            const deduzioneAnno = Math.min(investimentoEffettivoAnno, limiteDeduzione);
            risparmioAnnoEffettivo = this._calculateTaxSavings(reddito, deduzioneAnno, quotaDatoreFp);

            // Strategia Mix
            contributoFpMixAnno = Math.min(investimentoEffettivoAnno, limiteDeduzione) + quotaDatoreFp;
            contributoPacMixAnno = Math.max(investimentoEffettivoAnno - limiteDeduzione, 0);
          } else {
            // Nessun reinvestimento: contributo fisso ogni anno
            investimentoEffettivoAnno = investimento;
            contributoFpAnno = investimento + quotaDatoreFp;
            risparmioAnnoEffettivo = risparmioAnnoBase;

            // Strategia Mix
            contributoFpMixAnno = Math.min(investimento, limiteDeduzione) + quotaDatoreFp;
            contributoPacMixAnno = Math.max(investimento - limiteDeduzione, 0);
          }

          contributoPacAnno = investimento;

          // Calcola le quote di quest'anno in base all'investimento effettivo
          quotaEntroMinAnno = Math.min(investimentoEffettivoAnno, quotaMinAderente);
          quotaExtraMinAnno = Math.max(investimentoEffettivoAnno - quotaMinAderente, 0);
          quotaEntroDedAnno = Math.min(investimentoEffettivoAnno, limiteDeduzione);
          quotaExtraDedAnno = Math.max(investimentoEffettivoAnno - limiteDeduzione, 0);

          // Aggiorna montanti (versamento a inizio anno, poi crescita)
          montanteFP = (montanteFP + contributoFpAnno) * (1 + rFP);
          montantePAC = (montantePAC + contributoPacAnno) * (1 + rPAC);
          montanteFPMix = (montanteFPMix + contributoFpMixAnno) * (1 + rFP);
          montantePACMix = (montantePACMix + contributoPacMixAnno) * (1 + rPAC);

          investimentoTotalePAC += contributoPacAnno;
          investimentoTotalePACMix += contributoPacMixAnno;
          risparmioAccumulato += risparmioAnnoEffettivo;
          contributoAderenteTotale += investimentoEffettivoAnno;
          contributoDatoreTotale += quotaDatoreFp;

          // Contributi di quest'anno
          aderenteAnno = investimentoEffettivoAnno;
          datoreAnno = quotaDatoreFp;

        } else {
          // MODALITÀ INVESTIMENTO SINGOLO: investi solo nell'anno 1, poi reinvesti i risparmi
          if (anno === 1) {
            // Anno 1: investimento iniziale
            investimentoEffettivoAnno = investimento;
            contributoFpAnno = investimento + quotaDatoreFp;
            contributoPacAnno = investimento;

            montanteFP = contributoFpAnno * (1 + rFP);
            montantePAC = contributoPacAnno * (1 + rPAC);

            // Strategia Mix
            contributoFpMixAnno = Math.min(investimento, limiteDeduzione) + quotaDatoreFp;
            contributoPacMixAnno = Math.max(investimento - limiteDeduzione, 0);
            montanteFPMix = contributoFpMixAnno * (1 + rFP);
            montantePACMix = contributoPacMixAnno * (1 + rPAC);

            investimentoTotalePAC = contributoPacAnno;
            investimentoTotalePACMix = contributoPacMixAnno;

            // Risparmio fiscale generato nell'anno 1 (disponibile dall'anno 2)
            risparmioAnnoEffettivo = risparmioAnnoBase;
            risparmioAccumulato = risparmioAnnoEffettivo;
            contributoAderenteTotale = investimento;
            contributoDatoreTotale = quotaDatoreFp;

            // Calcola le quote per l'anno 1
            quotaEntroMinAnno = Math.min(investimento, quotaMinAderente);
            quotaExtraMinAnno = Math.max(investimento - quotaMinAderente, 0);
            quotaEntroDedAnno = Math.min(investimento, limiteDeduzione);
            quotaExtraDedAnno = Math.max(investimento - limiteDeduzione, 0);

            // Contributi di quest'anno
            aderenteAnno = investimento;
            datoreAnno = quotaDatoreFp;

          } else {
            // Anni 2+: solo crescita composta (e reinvesti risparmi se abilitato)
            if (reinvestiRisparmio && risparmioDaReinvestire > 0) {
              // Reinvesti il risparmio fiscale dell'anno precedente
              investimentoEffettivoAnno = risparmioDaReinvestire;
              montanteFP = (montanteFP + risparmioDaReinvestire) * (1 + rFP);
              montanteFPMix = (montanteFPMix + risparmioDaReinvestire) * (1 + rFP);

              // Calcola il nuovo (minore) risparmio fiscale dall'importo reinvestito
              const deduzioneReinvest = Math.min(risparmioDaReinvestire, limiteDeduzione);
              risparmioAnnoEffettivo = this._calculateTaxSavings(reddito, deduzioneReinvest, quotaDatoreFp);

              // Traccia il totale dei risparmi generati (per la visualizzazione)
              risparmioAccumulato += risparmioAnnoEffettivo;

              // Aggiorna le quote per quest'anno (solo risparmi reinvestiti)
              quotaEntroMinAnno = Math.min(risparmioDaReinvestire, quotaMinAderente);
              quotaExtraMinAnno = Math.max(risparmioDaReinvestire - quotaMinAderente, 0);
              quotaEntroDedAnno = Math.min(risparmioDaReinvestire, limiteDeduzione);
              quotaExtraDedAnno = Math.max(risparmioDaReinvestire - limiteDeduzione, 0);

              // Aggiorna contributo totale
              contributoAderenteTotale += risparmioDaReinvestire;

              // Contributi di quest'anno (solo risparmio reinvestito, datore = 0)
              aderenteAnno = risparmioDaReinvestire;
              datoreAnno = 0;
            } else {
              // Solo crescita composta, nessun nuovo contributo
              investimentoEffettivoAnno = 0;
              montanteFP = montanteFP * (1 + rFP);
              montanteFPMix = montanteFPMix * (1 + rFP);
              risparmioAnnoEffettivo = 0;

              // Nessun nuovo investimento quest'anno, quindi quote a 0
              quotaEntroMinAnno = 0;
              quotaExtraMinAnno = 0;
              quotaEntroDedAnno = 0;
              quotaExtraDedAnno = 0;
            }

            montantePAC = montantePAC * (1 + rPAC);
            montantePACMix = montantePACMix * (1 + rPAC);
          }
        }

        // Aggiorna risparmioDaReinvestire per l'anno prossimo
        risparmioDaReinvestire = risparmioAnnoEffettivo;

        // Tassazione FP
        const tassazioneFP = this.calcolaTassazioneFp(anno - 1, riscattoAnticipato);

        // Calcolo exit FP
        // Il risparmio fiscale di QUEST'ANNO non è ancora nel montante (sarà reinvestito l'anno prossimo)
        // Quindi aggiungiamo sempre il risparmio dell'anno corrente al valore di exit
        let exitFP = montanteFP * (1 - tassazioneFP);
        if (reinvestiRisparmio) {
          // Aggiungi solo il risparmio pendente di quest'anno (non ancora reinvestito)
          exitFP += risparmioAnnoEffettivo;
        } else {
          // Aggiungi tutti i risparmi accumulati (tenuti separati, non investiti)
          exitFP += risparmioAccumulato;
        }

        // Exit PAC: 26% di tasse solo sulle plusvalenze
        const plusvalenzaPAC = montantePAC - investimentoTotalePAC;
        const exitPAC = montantePAC - (plusvalenzaPAC * FINANCIAL_CONSTANTS.TASSAZIONE_RENDITE_PAC);

        // Exit Mix (stessa logica del FP per la porzione FP)
        let exitFPMix = montanteFPMix * (1 - tassazioneFP);
        if (reinvestiRisparmio) {
          exitFPMix += risparmioAnnoEffettivo;
        } else {
          exitFPMix += risparmioAccumulato;
        }
        const plusvalenzaPACMix = montantePACMix - investimentoTotalePACMix;
        const exitPACMix = montantePACMix - (plusvalenzaPACMix * FINANCIAL_CONSTANTS.TASSAZIONE_RENDITE_PAC);
        const exitMix = exitFPMix + exitPACMix;

        // Memorizza i risultati per quest'anno
        // Tutti i valori sono PER ANNO (non cumulati)
        results.push({
          "Anno": anno,
          "Entro Min": Math.round(quotaEntroMinAnno),
          "Extra Min": Math.round(quotaExtraMinAnno),
          "Entro Ded": Math.round(quotaEntroDedAnno),
          "Extra Ded": Math.round(quotaExtraDedAnno),
          "Aderente": Math.round(aderenteAnno),
          "Datore": Math.round(datoreAnno),
          "Risparmio": Math.round(risparmioAnnoEffettivo),
          "Exit FP": Math.round(exitFP),
          "Exit PAC": Math.round(exitPAC),
          "Exit Mix": Math.round(exitMix),
        });
      }

      // Per il valore di ritorno, usa i risparmi accumulati finali
      const risparmioImpostaFinale = risparmioAccumulato;

      // Calcola l'anno di breakeven (quando il PAC diventa migliore del FP)
      const breakeven = this._calculateBreakeven(results);

      // Genera il testo della strategia
      const strategyText = this._generateStrategyText(results, breakeven, modalitaCumulativa);

      return {
        results,
        strategyText,
        breakeven,
        risparmioImposta: Math.round(risparmioImpostaFinale),
        quotaDatoreFp: Math.round(quotaDatoreFp)
      };
    }

    /**
     * Calcola il valore futuro di una rendita anticipata (versamenti a inizio periodo)
     * VF = C × (1+r) × [(1+r)^n - 1] / r
     * @param {number} contributo - Contributo annuale
     * @param {number} r - Tasso di rendimento annuale
     * @param {number} anni - Numero di anni
     * @returns {number} Valore futuro
     */
    _calculateAnnuityDue(contributo, r, anni) {
      if (r === 0) return contributo * anni;
      return contributo * (1 + r) * (Math.pow(1 + r, anni) - 1) / r;
    }

    /**
     * Calcola l'anno di breakeven quando l'exit del PAC supera quello del FP
     * @param {Array} results - Risultati dei calcoli
     * @returns {number|null} Anno di breakeven o null se il PAC non supera mai il FP
     */
    _calculateBreakeven(results) {
      for (let i = 0; i < results.length; i++) {
        if (results[i]['Exit PAC'] > results[i]['Exit FP']) {
          return results[i]['Anno'];
        }
      }
      return null; // Il PAC non supera mai il FP nella durata
    }

    /**
     * Calcola il risparmio fiscale dal contributo al fondo pensione (base, senza cascata)
     * @param {number} reddito - Reddito annuale
     * @param {number} investimento - Importo dell'investimento
     * @param {number} quotaDatoreFp - Contributo del datore
     * @returns {number} Importo del risparmio fiscale
     */
    _calculateTaxSavings(reddito, investimento, quotaDatoreFp) {
      const redditoImponibile = reddito * (1 - FINANCIAL_CONSTANTS.TASSAZIONE_INPS);
      const limiteDeduzione = Math.max(FINANCIAL_CONSTANTS.LIMITE_DEDUZIONE_FP - quotaDatoreFp, 0);

      // La deduzione è il minimo tra investimento e limite di deduzione
      const deduzione = Math.min(investimento, limiteDeduzione);

      // Calcola l'imposta senza deduzione
      const impostaLorda = this.calcolaImposta(redditoImponibile);
      const detrazione = this.calcolaDetrazioniDipendente(redditoImponibile);
      const impostaNetta = Math.max(impostaLorda - detrazione, 0);

      // Calcola l'imposta con deduzione
      const redditoDedotto = Math.max(redditoImponibile - deduzione, 0);
      const impostaLordaDedotta = this.calcolaImposta(redditoDedotto);
      const impostaNettaDedotta = Math.max(impostaLordaDedotta - detrazione, 0);

      // Risparmio fiscale
      return impostaNetta - impostaNettaDedotta;
    }

    /**
     * Calcola il risparmio fiscale effettivo con effetto cascata quando si reinveste
     * Il risparmio genera altro risparmio: risparmio → reinvesti → altro risparmio → ...
     * Converge a: totaleRisparmio = risparmioBase / (1 - aliquotaMarginale)
     * @param {number} reddito - Reddito annuale
     * @param {number} investimento - Importo dell'investimento base
     * @param {number} quotaDatoreFp - Contributo del datore
     * @returns {Object} {risparmio, investimentoEffettivo, aliquotaMarginale}
     */
    _calculateCascadeTaxSavings(reddito, investimento, quotaDatoreFp) {
      const redditoImponibile = reddito * (1 - FINANCIAL_CONSTANTS.TASSAZIONE_INPS);
      const limiteDeduzione = Math.max(FINANCIAL_CONSTANTS.LIMITE_DEDUZIONE_FP - quotaDatoreFp, 0);

      // Calcola l'aliquota marginale
      const aliquotaMarginale = this._getMarginalRate(redditoImponibile);

      // Con cascata: investimentoEffettivo = investimentoBase / (1 - aliquota)
      // Ma limitato al tetto di deduzione
      const investimentoEffettivo = Math.min(
        investimento / (1 - aliquotaMarginale),
        limiteDeduzione
      );

      // Calcola il risparmio fiscale effettivo sull'investimento effettivo
      const risparmio = this._calculateTaxSavings(reddito, investimentoEffettivo, quotaDatoreFp);

      return {
        risparmio,
        investimentoEffettivo,
        aliquotaMarginale
      };
    }

    /**
     * Ottiene l'aliquota IRPEF marginale per un dato reddito
     * @param {number} reddito - Reddito imponibile
     * @returns {number} Aliquota marginale
     */
    _getMarginalRate(reddito) {
      if (reddito <= 28000) {
        return 0.23;
      } else if (reddito <= 60000) {
        return 0.33;
      } else {
        return 0.43;
      }
    }

    /**
     * Genera il testo della strategia basato sui risultati finali
     * @param {Array} results - Risultati dei calcoli
     * @param {number|null} breakeven - Anno di breakeven
     * @param {boolean} modalitaCumulativa - Se la modalità cumulativa è attiva
     * @returns {string} Descrizione della strategia
     */
    _generateStrategyText(results, breakeven, modalitaCumulativa) {
      if (!results.length) return "";

      const lastResult = results[results.length - 1];
      const exitFP = lastResult['Exit FP'];
      const exitPAC = lastResult['Exit PAC'];
      const exitMix = lastResult['Exit Mix'];

      const values = [
        { name: 'Fondo Pensione', value: exitFP },
        { name: 'PAC', value: exitPAC },
        { name: 'Mix', value: exitMix }
      ];

      const best = values.reduce((a, b) => a.value > b.value ? a : b);

      let breakevenText = '';
      if (breakeven) {
        breakevenText = ` Il PAC supera il FP dopo ${breakeven} anni.`;
      } else {
        breakevenText = ` Il FP rimane conveniente per tutta la durata.`;
      }

      const modeText = modalitaCumulativa ? ' (modalità cumulativa)' : '';

      return `Con i parametri inseriti${modeText}, la strategia migliore è ${best.name} con un exit di ${best.value.toLocaleString('it-IT')} €.${breakevenText}`;
    }

    /**
     * Calcola la tassazione del fondo pensione in base alla durata
     * Parte dal 15%, scende dello 0.3% ogni anno dopo l'anno 15, minimo 9%
     * In caso di riscatto anticipato, la tassazione è fissa al 23%
     * @param {number} anni - Durata dell'investimento in anni
     * @param {boolean} riscattoAnticipato - Se è un riscatto anticipato totale
     * @returns {number} Aliquota di tassazione
     */
    calcolaTassazioneFp(anni, riscattoAnticipato = false) {
      if (riscattoAnticipato) {
        return 0.23; // Tassazione fissa 23% per riscatto anticipato
      }
      return Math.max((15 - Math.max(anni + 1 - 15, 0) * 0.3), 9) / 100;
    }

    /**
     * Calcola l'imposta sul reddito in base agli scaglioni progressivi (IRPEF 2025)
     * @param {number} reddito - Importo del reddito
     * @returns {number} Importo dell'imposta
     */
    calcolaImposta(reddito) {
      let imposta;
      if (reddito <= 28000) {
        imposta = reddito * 0.23;
      } else if (reddito <= 60000) {
        imposta = 28000 * 0.23 + (reddito - 28000) * 0.33;
      } else {
        imposta = 28000 * 0.23 + 32000 * 0.33 + (reddito - 60000) * 0.43;
      }
      return imposta;
    }

    /**
     * Calcola le detrazioni per lavoro dipendente in base al reddito
     * @param {number} reddito - Importo del reddito
     * @returns {number} Importo della detrazione
     */
    calcolaDetrazioniDipendente(reddito) {
      let detrazione;

      if (reddito <= 15000) {
        detrazione = 1880;
      } else if (reddito <= 28000) {
        const rapporto = (28000 - reddito) / 13000;
        detrazione = 1910 + (1190 * rapporto);
      } else if (reddito <= 50000) {
        const rapporto = (50000 - reddito) / 22000;
        detrazione = 1910 * rapporto;
      } else {
        detrazione = 0;
      }

      if (reddito >= 25000 && reddito <= 35000) {
        detrazione += 65;
      }

      return detrazione;
    }

    /**
     * Converte i risultati in formato CSV
     * @param {Array} rows - Dati dei risultati
     * @returns {string} Stringa formattata CSV
     */
    convertToCSV(rows) {
      if (!rows.length) return '';

      let str = '';
      const headers = Object.keys(rows[0]).join(',');
      str += headers + '\r\n';

      for (let i = 0; i < rows.length; i++) {
        let line = '';
        for (let index in rows[i]) {
          if (line !== '') line += ',';
          line += rows[i][index];
        }
        str += line + '\r\n';
      }
      return str;
    }
  }
