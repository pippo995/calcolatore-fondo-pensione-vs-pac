# Calcolatore Fondo Pensione vs PAC

https://pippo995.github.io/calcolatore-fondo-pensione-vs-pac/

Confronta **Fondo Pensione** e **PAC in ETF** nel contesto fiscale italiano.

Assunzione principale: il modello è pensato per un **lavoratore dipendente** e usa RAL, contributi INPS stimati, detrazioni da lavoro dipendente e possibile contributo del datore.

## Cosa fa

- Calcola il valore netto finale di FP, PAC e mix consigliato
- Tiene conto di: deduzione IRPEF, contributo datore, tassazione all'uscita
- Ottimizza la quota deducibile tra FP e PAC anno per anno
- Considera la quota oltre deduzione sempre nel PAC

## Opzioni

| Opzione | Descrizione |
|---------|-------------|
| Riscatto anticipato | Tassazione 23% invece di 15%→9% |
| Viste tabella | Mix, confronto scenari o dettaglio completo |

Il calcolo è sempre cumulativo e reinveste sempre il risparmio fiscale stimato l'anno successivo: il beneficio fiscale non è trattato come bonus separato, ma come capitale da reinvestire per confrontare FP e PAC in modo coerente.

## Avvio locale

Prerequisiti:

- Node.js installato
- un browser moderno

```bash
git clone https://github.com/pippo995/calcolatore-fondo-pensione-vs-pac.git
cd calcolatore-fondo-pensione-vs-pac
npm start
```

Poi apri:

```text
http://localhost:9000
```

Alternativa senza `npm`:

```bash
python3 -m http.server 9000
```

e apri lo stesso URL.

> Nota: non aprire direttamente `index.html` come file locale. L'app usa moduli JavaScript ES (`type="module"`), quindi serve un piccolo server statico.

## Test

```bash
npm test
```

I test coprono la logica principale di calcolo del modello finanziario.

## Struttura

```text
index.html                         UI e contenuti della guida
styles.css                         stile e responsive layout
js/app.js                          entrypoint JavaScript
js/controllers/FinancialController.js
js/models/FinancialModel.js        logica di calcolo
js/views/FinancialView.js          rendering tabella, metriche e grafico
js/constants/financial-constants.js
test/FinancialModel.test.js        test del modello
```

## Tech

HTML, CSS, JavaScript vanilla. No framework.

L'app usa CDN esterne per Chart.js, Font Awesome e Google Fonts.
