import { TaxRatesUsedNotification, TransactionPayoutTotalsAdjustedNotification, TransactionPayoutTotalsNotification, TransactionTotalsAdjustedNotification, TransactionTotalsNotification, } from '../shared/index.js';
import { TransactionLineItemNotification } from './transaction-line-item-notification.js';
export class TransactionDetailsNotification {
    taxRatesUsed;
    totals;
    adjustedTotals;
    payoutTotals;
    adjustedPayoutTotals;
    lineItems;
    constructor(transactionDetails) {
        this.taxRatesUsed = transactionDetails.tax_rates_used.map((tax_rates_used) => new TaxRatesUsedNotification(tax_rates_used));
        this.totals = transactionDetails.totals ? new TransactionTotalsNotification(transactionDetails.totals) : null;
        this.adjustedTotals = transactionDetails.adjusted_totals
            ? new TransactionTotalsAdjustedNotification(transactionDetails.adjusted_totals)
            : null;
        this.payoutTotals = transactionDetails.payout_totals
            ? new TransactionPayoutTotalsNotification(transactionDetails.payout_totals)
            : null;
        this.adjustedPayoutTotals = transactionDetails.adjusted_payout_totals
            ? new TransactionPayoutTotalsAdjustedNotification(transactionDetails.adjusted_payout_totals)
            : null;
        this.lineItems = transactionDetails.line_items.map((line_item) => new TransactionLineItemNotification(line_item));
    }
}
