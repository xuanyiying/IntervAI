import { ChargebackFee } from './chargeback-fee.js';
export class TransactionPayoutTotalsAdjusted {
    subtotal;
    tax;
    total;
    fee;
    chargebackFee;
    earnings;
    currencyCode;
    exchangeRate;
    retainedFee;
    constructor(transactionPayoutTotalsAdjusted) {
        this.subtotal = transactionPayoutTotalsAdjusted.subtotal;
        this.tax = transactionPayoutTotalsAdjusted.tax;
        this.total = transactionPayoutTotalsAdjusted.total;
        this.fee = transactionPayoutTotalsAdjusted.fee;
        this.chargebackFee = transactionPayoutTotalsAdjusted.chargeback_fee
            ? new ChargebackFee(transactionPayoutTotalsAdjusted.chargeback_fee)
            : null;
        this.earnings = transactionPayoutTotalsAdjusted.earnings;
        this.currencyCode = transactionPayoutTotalsAdjusted.currency_code;
        this.exchangeRate = transactionPayoutTotalsAdjusted.exchange_rate;
        this.retainedFee = transactionPayoutTotalsAdjusted.retained_fee;
    }
}
