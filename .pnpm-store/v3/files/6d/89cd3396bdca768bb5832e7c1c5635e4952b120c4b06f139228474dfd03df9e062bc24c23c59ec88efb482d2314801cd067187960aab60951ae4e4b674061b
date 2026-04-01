export class TransactionTotalsNotification {
    subtotal;
    discount;
    tax;
    total;
    credit;
    creditToBalance;
    balance;
    grandTotal;
    fee;
    earnings;
    currencyCode;
    constructor(transactionTotals) {
        this.subtotal = transactionTotals.subtotal;
        this.discount = transactionTotals.discount;
        this.tax = transactionTotals.tax;
        this.total = transactionTotals.total;
        this.credit = transactionTotals.credit;
        this.creditToBalance = transactionTotals.credit_to_balance;
        this.balance = transactionTotals.balance;
        this.grandTotal = transactionTotals.grand_total;
        this.fee = transactionTotals.fee ? transactionTotals.fee : null;
        this.earnings = transactionTotals.earnings ? transactionTotals.earnings : null;
        this.currencyCode = transactionTotals.currency_code;
    }
}
