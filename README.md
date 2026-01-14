# Calcolatore Fondo Pensione vs PAC

https://pippo995.github.io/calcolatore-fondo-pensione-ita/

Confronta **Fondo Pensione** e **PAC in ETF** nel contesto fiscale italiano.

## Cosa fa

- Calcola il valore netto finale di FP, PAC e strategia mista
- Tiene conto di: deduzione IRPEF, contributo datore, tassazione all'uscita
- Mostra il breakeven (quando il PAC supera il FP)

## Opzioni

| Opzione | Descrizione |
|---------|-------------|
| Cumulativo | Versamento ogni anno vs singolo versamento |
| Reinvesti deduzione | Reinveste il risparmio fiscale nel FP |
| Riscatto anticipato | Tassazione 23% invece di 15%→9% |
| Mostra dettaglio | Tutte le colonne vs solo Exit |

## Avvio locale

```bash
git clone https://github.com/pippo995/calcolatore-fondo-pensione-ita.git
cd calcolatore-fondo-pensione-ita
# Aprire index.html con Live Server (VS Code) o qualsiasi server locale
```

## Tech

HTML, CSS, JavaScript vanilla. No framework.
