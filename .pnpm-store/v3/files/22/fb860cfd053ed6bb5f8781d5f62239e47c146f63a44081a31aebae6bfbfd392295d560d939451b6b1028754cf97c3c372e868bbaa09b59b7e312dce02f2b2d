import { TaxRatesUsed, TransactionTotals } from '../shared/index.js';
import { TransactionLineItemPreview } from './transaction-line-item-preview.js';
export class TransactionDetailsPreview {
    taxRatesUsed;
    totals;
    lineItems;
    constructor(transactionDetailsPreview) {
        this.taxRatesUsed = transactionDetailsPreview.tax_rates_used.map((tax_rates_used) => new TaxRatesUsed(tax_rates_used));
        this.totals = new TransactionTotals(transactionDetailsPreview.totals);
        this.lineItems = transactionDetailsPreview.line_items.map((line_item) => new TransactionLineItemPreview(line_item));
    }
}
