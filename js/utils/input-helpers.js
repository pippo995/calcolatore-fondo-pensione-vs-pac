import { COMPARTI_FP, ETF_PRESETS } from '../constants/financial-constants.js';

export function resolveRendimentoFp(compartoId, fallback = 0) {
  const comparto = COMPARTI_FP[compartoId];
  return comparto ? comparto.rendimentoDefault : fallback;
}

export function resolveRendimentoPac(etfId, fallback = 0) {
  const etf = ETF_PRESETS[etfId];
  return etf ? etf.rendimentoDefault : fallback;
}

export function buildInputWarnings(config) {
  const warnings = [];
  const investimentoMinimoDatore = config.reddito * config.quotaMinAderentePerc;

  if (config.investimento > config.reddito * 0.5 && config.reddito > 0) {
    warnings.push('Investimento annuo molto alto rispetto al reddito: verifica che sia sostenibile e netto di altre esigenze.');
  }

  if (config.investimento < investimentoMinimoDatore && config.quotaDatoreFpPerc > 0) {
    warnings.push('Con questi input non raggiungi la quota minima per ottenere il contributo del datore.');
  }

  if (config.rendimentoAnnualePacPerc < config.rendimentoAnnualeFpPerc) {
    warnings.push('Il rendimento PAC ipotizzato è più basso del rendimento FP: in questo scenario il confronto perde senso, perché il PAC non ha un vantaggio di rendimento atteso.');
  }

  if (config.rendimentoAnnualePacPerc - config.rendimentoAnnualeFpPerc >= 0.06) {
    warnings.push('Il PAC ha un rendimento ipotizzato molto più alto del FP: il mix consigliato sarà particolarmente sensibile a questa scelta.');
  }

  if (config.addizionaliPerc > 0.04) {
    warnings.push('Addizionali sopra il 4%: controlla che la percentuale inserita includa solo regionale e comunale.');
  }

  if (config.ulterioriDetrazioni > 3000) {
    warnings.push('Ulteriori detrazioni elevate possono ridurre molto la capienza fiscale e quindi il beneficio della deduzione.');
  }

  return warnings;
}
