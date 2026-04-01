import { TaxRatesUsed, TransactionPayoutTotals, TransactionPayoutTotalsAdjusted, TransactionTotals, TransactionTotalsAdjusted, } from '../shared/index.js';
import { TransactionLineItem } from './transaction-line-item.js';
export class TransactionDetails {
    taxRatesUsed;
    totals;
    adjustedTotals;
    payoutTotals;
    adjustedPayoutTotals;
    lineItems;
    constructor(transactionDetails) {
        this.taxRatesUsed = transactionDetails.tax_rates_used.map((tax_rates_used) => new TaxRatesUsed(tax_rates_used));
        this.totals = transactionDetails.totals ? new TransactionTotals(transactionDetails.totals) : null;
        this.adjustedTotals = transactionDetails.adjusted_totals
            ? new TransactionTotalsAdjusted(transactionDetails.adjusted_totals)
            : null;
        this.payoutTotals = transactionDetails.payout_totals
            ? new TransactionPayoutTotals(transactionDetails.payout_totals)
            : null;
        this.adjustedPayoutTotals = transactionDetails.adjusted_payout_totals
            ? new TransactionPayoutTotalsAdjusted(transactionDetails.adjusted_payout_totals)
            : null;
        this.lineItems = transactionDetails.line_items.map((line_item) => new TransactionLineItem(line_item));
    }
}
