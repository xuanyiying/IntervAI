import { Totals } from './totals.js';
export class TaxRatesUsed {
    taxRate;
    totals;
    constructor(taxRatesUsed) {
        this.taxRate = taxRatesUsed.tax_rate;
        this.totals = taxRatesUsed.totals ? new Totals(taxRatesUsed.totals) : null;
    }
}
