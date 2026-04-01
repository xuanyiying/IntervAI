import { TotalsNotification } from './totals-notification.js';
export class TaxRatesUsedNotification {
    taxRate;
    totals;
    constructor(taxRatesUsed) {
        this.taxRate = taxRatesUsed.tax_rate;
        this.totals = taxRatesUsed.totals ? new TotalsNotification(taxRatesUsed.totals) : null;
    }
}
