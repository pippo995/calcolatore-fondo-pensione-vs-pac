import { FINANCIAL_CONSTANTS } from '../constants/financial-constants.js';

/**
 * FinancialModel - Contiene tutta la logica di business e i calcoli
 * Calcola l'evoluzione di un singolo investimento nel tempo
 */
export class FinancialModel {
    /**
     * Calcola tutti gli scenari finanziari basati sui parametri di input
     * Supporta 4 combinazioni: singolo/cumulativo x reinvesti/non-reinvesti
     * @param {Object} config - Oggetto di configurazione con tutti i parametri
     * @returns {Object} Risultati e informazioni sul mix
     */
    calculateResults(config) {
      const {
        durata, reddito, investimento,
        quotaDatoreFpPerc, quotaMinAderentePerc,
        rendimentoAnnualeFpPerc, rendimentoAnnualePacPerc,
        reinvestiRisparmio, modalitaCumulativa, riscattoAnticipato,
        addizionaliPerc = 0, ulterioriDetrazioni = 0
      } = config;

      const optimizedResults = [];
      const fpStrategyResults = [];
      const pacStrategyResults = [];
      const quotaMinAderente = reddito * quotaMinAderentePerc;
      const quotaDatorePotenziale = reddito * quotaDatoreFpPerc;
      const rFP = rendimentoAnnualeFpPerc;
      const rPAC = rendimentoAnnualePacPerc;

      const fpPlan = this._createStrategyState();
      const pacPlan = this._createStrategyState();
      const recommendedPlan = this._createStrategyState();

      for (let anno = 1; anno <= durata; anno++) {
        const budgetBaseAnno = modalitaCumulativa || anno === 1 ? investimento : 0;
        const tassazioneFP = this.calcolaTassazioneFp(anno - 1, riscattoAnticipato);
        const anniResidui = durata - anno + 1;

        const fpBudget = budgetBaseAnno + (reinvestiRisparmio ? fpPlan.risparmioDaReinvestire : 0);
        const pacBudget = budgetBaseAnno;
        const recommendedBudget = budgetBaseAnno + (reinvestiRisparmio ? recommendedPlan.risparmioDaReinvestire : 0);

        const fpAllocation = this._splitBudget(fpBudget, quotaMinAderente, quotaDatorePotenziale);
        const pacCapacity = this._splitBudget(pacBudget, quotaMinAderente, quotaDatorePotenziale);
        const recommendedCapacity = this._splitBudget(recommendedBudget, quotaMinAderente, quotaDatorePotenziale);
        const recommendedAllocation = this._optimizeRecommendedAllocation({
          budget: recommendedBudget,
          quotaMinAderente,
          quotaDatorePotenziale,
          reddito,
          addizionaliPerc,
          ulterioriDetrazioni,
          rFP,
          rPAC,
          anniResidui,
          tassazioneFP
        });

        const risparmioFpAnno = this._calculateTaxSavings(
          reddito,
          fpAllocation.quotaDeducibile,
          fpAllocation.quotaDatore,
          addizionaliPerc,
          ulterioriDetrazioni
        );
        const risparmioRecommendedAnno = recommendedAllocation.risparmio;

        this._applyYearGrowth(fpPlan, {
          fpContributo: fpAllocation.quotaDeducibile + fpAllocation.quotaDatore,
          pacContributo: fpAllocation.quotaExtraPac,
          risparmioAnno: risparmioFpAnno,
          rFP,
          rPAC,
          reinvestiRisparmio
        });

        this._applyYearGrowth(pacPlan, {
          fpContributo: 0,
          pacContributo: pacBudget,
          risparmioAnno: 0,
          rFP,
          rPAC,
          reinvestiRisparmio
        });

        this._applyYearGrowth(recommendedPlan, {
          fpContributo: recommendedAllocation.quotaFp + recommendedAllocation.quotaDatore,
          pacContributo: recommendedAllocation.quotaPac,
          risparmioAnno: risparmioRecommendedAnno,
          rFP,
          rPAC,
          reinvestiRisparmio
        });

        const exitFP = this._calculateStrategyExit(fpPlan, tassazioneFP, reinvestiRisparmio);
        const exitPAC = this._calculateStrategyExit(pacPlan, tassazioneFP, reinvestiRisparmio);
        const exitRecommended = this._calculateStrategyExit(recommendedPlan, tassazioneFP, reinvestiRisparmio);

        optimizedResults.push(this._createResultRow({
          anno,
          quotaEntroMinAnno: Math.min(recommendedCapacity.quotaDeducibile, quotaMinAderente),
          quotaExtraMinAnno: Math.max(recommendedCapacity.quotaDeducibile - quotaMinAderente, 0),
          quotaEntroDedAnno: recommendedCapacity.quotaDeducibile,
          quotaExtraDedAnno: recommendedCapacity.quotaExtraPac,
          aderenteAnno: recommendedBudget,
          datoreAnno: recommendedAllocation.quotaDatore,
          risparmioAnnoEffettivo: risparmioRecommendedAnno,
          quotaFpConsigliataAnno: recommendedAllocation.quotaFp,
          quotaPacConsigliataAnno: recommendedAllocation.quotaPac,
          sceltaAnno: recommendedAllocation.scelta,
          exitFP,
          exitPAC,
          exitMix: exitRecommended
        }));

        fpStrategyResults.push(this._createResultRow({
          anno,
          quotaEntroMinAnno: Math.min(fpAllocation.quotaDeducibile, quotaMinAderente),
          quotaExtraMinAnno: Math.max(fpAllocation.quotaDeducibile - quotaMinAderente, 0),
          quotaEntroDedAnno: fpAllocation.quotaDeducibile,
          quotaExtraDedAnno: fpAllocation.quotaExtraPac,
          aderenteAnno: fpBudget,
          datoreAnno: fpAllocation.quotaDatore,
          risparmioAnnoEffettivo: risparmioFpAnno,
          quotaFpConsigliataAnno: fpAllocation.quotaDeducibile,
          quotaPacConsigliataAnno: fpAllocation.quotaExtraPac,
          sceltaAnno: fpAllocation.quotaExtraPac > 0 ? 'MIX' : 'FP',
          exitFP,
          exitPAC,
          exitMix: exitFP
        }));

        pacStrategyResults.push(this._createResultRow({
          anno,
          quotaEntroMinAnno: Math.min(pacCapacity.quotaDeducibile, quotaMinAderente),
          quotaExtraMinAnno: Math.max(pacCapacity.quotaDeducibile - quotaMinAderente, 0),
          quotaEntroDedAnno: pacCapacity.quotaDeducibile,
          quotaExtraDedAnno: pacCapacity.quotaExtraPac,
          aderenteAnno: pacBudget,
          datoreAnno: 0,
          risparmioAnnoEffettivo: 0,
          quotaFpConsigliataAnno: 0,
          quotaPacConsigliataAnno: pacBudget,
          sceltaAnno: 'PAC',
          exitFP,
          exitPAC,
          exitMix: exitPAC
        }));
      }

      const finalOptimized = optimizedResults.at(-1)['Exit Mix'];
      const finalFp = optimizedResults.at(-1)['Exit FP'];
      const finalPac = optimizedResults.at(-1)['Exit PAC'];
      const selectedStrategy = [
        { results: optimizedResults, plan: recommendedPlan, exit: finalOptimized },
        { results: fpStrategyResults, plan: fpPlan, exit: finalFp },
        { results: pacStrategyResults, plan: pacPlan, exit: finalPac }
      ].reduce((best, current) => current.exit > best.exit ? current : best);
      const results = selectedStrategy.results;
      const breakeven = this._calculateFirstFullFpYear(results);

      return {
        results,
        breakeven,
        risparmioImposta: Math.round(selectedStrategy.plan.risparmioAccumulato),
        quotaDatoreFp: investimento >= quotaMinAderente ? Math.round(quotaDatorePotenziale) : 0
      };
    }

    _createStrategyState() {
      return {
        montanteFP: 0,
        contributiFP: 0,
        montantePAC: 0,
        investimentoPAC: 0,
        risparmioAccumulato: 0,
        risparmioDaReinvestire: 0
      };
    }

    _splitBudget(budget, quotaMinAderente, quotaDatorePotenziale) {
      if (budget <= 0) {
        return { quotaDeducibile: 0, quotaExtraPac: 0, quotaDatore: 0 };
      }

      const quotaDatore = budget >= quotaMinAderente ? quotaDatorePotenziale : 0;
      const limiteDeduzione = Math.max(FINANCIAL_CONSTANTS.LIMITE_DEDUZIONE_FP - quotaDatore, 0);
      const quotaDeducibile = Math.min(budget, limiteDeduzione);

      return {
        quotaDeducibile,
        quotaExtraPac: Math.max(budget - quotaDeducibile, 0),
        quotaDatore: quotaDeducibile >= quotaMinAderente ? quotaDatore : 0
      };
    }

    _optimizeRecommendedAllocation({
      budget,
      quotaMinAderente,
      quotaDatorePotenziale,
      reddito,
      addizionaliPerc,
      ulterioriDetrazioni,
      rFP,
      rPAC,
      anniResidui,
      tassazioneFP
    }) {
      if (budget <= 0) {
        return { quotaFp: 0, quotaPac: 0, quotaDatore: 0, risparmio: 0, scelta: 'PAC' };
      }

      const candidates = new Set([0]);
      const maxWithoutEmployer = Math.min(budget, FINANCIAL_CONSTANTS.LIMITE_DEDUZIONE_FP);
      const maxWithEmployer = Math.min(
        budget,
        Math.max(FINANCIAL_CONSTANTS.LIMITE_DEDUZIONE_FP - quotaDatorePotenziale, 0)
      );

      for (let amount = 0; amount <= Math.floor(maxWithoutEmployer); amount++) {
        candidates.add(amount);
      }
      candidates.add(maxWithoutEmployer);
      candidates.add(maxWithEmployer);
      candidates.add(Math.min(quotaMinAderente, budget));

      let best = null;

      for (const candidate of candidates) {
        const quotaFp = Math.max(candidate, 0);
        const quotaDatore = quotaFp >= quotaMinAderente ? quotaDatorePotenziale : 0;
        const limiteDeduzione = Math.max(FINANCIAL_CONSTANTS.LIMITE_DEDUZIONE_FP - quotaDatore, 0);

        if (quotaFp > budget || quotaFp > limiteDeduzione) continue;

        const quotaPac = budget - quotaFp;
        const risparmio = quotaFp > 0
          ? this._calculateTaxSavings(
            reddito,
            quotaFp,
            quotaDatore,
            addizionaliPerc,
            ulterioriDetrazioni
          )
          : 0;
        const fpContributo = quotaFp + quotaDatore;
        const fpMontante = fpContributo * Math.pow(1 + rFP, anniResidui);
        const fpNetto = fpMontante - (fpContributo * tassazioneFP) + risparmio;
        const pacMontante = quotaPac * Math.pow(1 + rPAC, anniResidui);
        const pacNetto = this._calculatePacExit(pacMontante, quotaPac);
        const totaleNetto = fpNetto + pacNetto;

        if (!best || totaleNetto > best.totaleNetto) {
          best = { quotaFp, quotaPac, quotaDatore, risparmio, totaleNetto };
        }
      }

      const scelta = best.quotaFp <= 0
        ? 'PAC'
        : best.quotaPac <= 0
          ? 'FP'
          : 'MIX';

      return { ...best, scelta };
    }

    _applyYearGrowth(state, {
      fpContributo,
      pacContributo,
      risparmioAnno,
      rFP,
      rPAC,
      reinvestiRisparmio
    }) {
      state.montanteFP = (state.montanteFP + fpContributo) * (1 + rFP);
      state.contributiFP += fpContributo;
      state.montantePAC = (state.montantePAC + pacContributo) * (1 + rPAC);
      state.investimentoPAC += pacContributo;
      state.risparmioAccumulato += risparmioAnno;
      state.risparmioDaReinvestire = reinvestiRisparmio ? risparmioAnno : 0;
    }

    _calculateStrategyExit(state, tassazioneFP, reinvestiRisparmio) {
      const exitFP = this._calculateFpExit({
        montante: state.montanteFP,
        contributi: state.contributiFP,
        tassazione: tassazioneFP,
        risparmioAnno: state.risparmioDaReinvestire,
        risparmioAccumulato: state.risparmioAccumulato,
        reinvestiRisparmio
      });
      const exitPAC = this._calculatePacExit(state.montantePAC, state.investimentoPAC);

      return exitFP + exitPAC;
    }

    /**
     * Calcola il netto di uscita per la componente Fondo Pensione.
     * La tassazione 15-9% si applica solo ai contributi, non ai rendimenti
     * gia considerati netti nel rendimento FP.
     */
    _calculateFpExit({
      montante,
      contributi,
      tassazione,
      risparmioAnno,
      risparmioAccumulato,
      reinvestiRisparmio
    }) {
      const risparmioDaAggiungere = reinvestiRisparmio ? risparmioAnno : risparmioAccumulato;
      return montante - (contributi * tassazione) + risparmioDaAggiungere;
    }

    /**
     * Calcola il netto PAC tassando solo le plusvalenze.
     */
    _calculatePacExit(montante, investimentoTotale) {
      const plusvalenza = Math.max(montante - investimentoTotale, 0);
      return montante - (plusvalenza * FINANCIAL_CONSTANTS.TASSAZIONE_RENDITE_PAC);
    }

    _createResultRow({
      anno,
      quotaEntroMinAnno,
      quotaExtraMinAnno,
      quotaEntroDedAnno,
      quotaExtraDedAnno,
      aderenteAnno,
      datoreAnno,
      risparmioAnnoEffettivo,
      quotaFpConsigliataAnno,
      quotaPacConsigliataAnno,
      sceltaAnno,
      exitFP,
      exitPAC,
      exitMix
    }) {
      return {
        "Anno": anno,
        "Entro Min": Math.round(quotaEntroMinAnno),
        "Extra Min": Math.round(quotaExtraMinAnno),
        "Entro Ded": Math.round(quotaEntroDedAnno),
        "Extra Ded": Math.round(quotaExtraDedAnno),
        "Aderente": Math.round(aderenteAnno),
        "Datore": Math.round(datoreAnno),
        "Risparmio": Math.round(risparmioAnnoEffettivo),
        "FP Cons": Math.round(quotaFpConsigliataAnno),
        "PAC Cons": Math.round(quotaPacConsigliataAnno),
        "Scelta": sceltaAnno,
        "Exit FP": Math.round(exitFP),
        "Exit PAC": Math.round(exitPAC),
        "Exit Mix": Math.round(exitMix),
      };
    }

    /**
     * Calcola il primo anno in cui tutta la quota deducibile va nel FP.
     * Prima di questo anno il mix puo comunque usare uno split FP/PAC.
     * @param {Array} results - Risultati dei calcoli
     * @returns {number|null} Primo anno FP pieno o null se non avviene
     */
    _calculateFirstFullFpYear(results) {
      for (let i = 0; i < results.length; i++) {
        if (results[i]['Entro Ded'] > 0 && results[i]['FP Cons'] >= results[i]['Entro Ded']) {
          return results[i]['Anno'];
        }
      }
      return null;
    }

    /**
     * Calcola il risparmio fiscale dal contributo al fondo pensione.
     * @param {number} reddito - Reddito annuale
     * @param {number} investimento - Importo dell'investimento
     * @param {number} quotaDatoreFp - Contributo del datore
     * @param {number} addizionaliPerc - Aliquota stimata addizionali regionali/comunali
     * @param {number} ulterioriDetrazioni - Altre detrazioni annue stimate
     * @returns {number} Importo del risparmio fiscale
     */
    _calculateTaxSavings(
      reddito,
      investimento,
      quotaDatoreFp,
      addizionaliPerc = 0,
      ulterioriDetrazioni = 0
    ) {
      const redditoImponibile = reddito * (1 - FINANCIAL_CONSTANTS.TASSAZIONE_INPS);
      const limiteDeduzione = Math.max(FINANCIAL_CONSTANTS.LIMITE_DEDUZIONE_FP - quotaDatoreFp, 0);

      // La deduzione è il minimo tra investimento e limite di deduzione
      const deduzione = Math.min(investimento, limiteDeduzione);

      // Calcola l'imposta senza deduzione
      const impostaLorda = this.calcolaImposta(redditoImponibile);
      const addizionali = redditoImponibile * addizionaliPerc;
      const detrazione = this.calcolaDetrazioniDipendente(redditoImponibile);
      const impostaNetta = Math.max(impostaLorda + addizionali - detrazione - ulterioriDetrazioni, 0);

      // Calcola l'imposta con deduzione
      const redditoDedotto = Math.max(redditoImponibile - deduzione, 0);
      const impostaLordaDedotta = this.calcolaImposta(redditoDedotto);
      const addizionaliDedotte = redditoDedotto * addizionaliPerc;
      const detrazioneDedotta = this.calcolaDetrazioniDipendente(redditoDedotto);
      const impostaNettaDedotta = Math.max(
        impostaLordaDedotta + addizionaliDedotte - detrazioneDedotta - ulterioriDetrazioni,
        0
      );

      // Risparmio fiscale
      return impostaNetta - impostaNettaDedotta;
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
     * Calcola l'imposta sul reddito in base agli scaglioni progressivi IRPEF 2025.
     * Aggiornato alla Legge 30 dicembre 2024, n. 207.
     * @param {number} reddito - Importo del reddito
     * @returns {number} Importo dell'imposta
     */
    calcolaImposta(reddito) {
      let imposta;
      if (reddito <= 28000) {
        imposta = reddito * 0.23;
      } else if (reddito <= 50000) {
        imposta = 28000 * 0.23 + (reddito - 28000) * 0.35;
      } else {
        imposta = 28000 * 0.23 + 22000 * 0.35 + (reddito - 50000) * 0.43;
      }
      return imposta;
    }

    /**
     * Calcola le detrazioni per lavoro dipendente in base al reddito.
     * Aggiornato alla Legge 30 dicembre 2024, n. 207.
     * @param {number} reddito - Importo del reddito
     * @returns {number} Importo della detrazione
     */
    calcolaDetrazioniDipendente(reddito) {
      let detrazione;

      if (reddito <= 15000) {
        detrazione = 1955;
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
