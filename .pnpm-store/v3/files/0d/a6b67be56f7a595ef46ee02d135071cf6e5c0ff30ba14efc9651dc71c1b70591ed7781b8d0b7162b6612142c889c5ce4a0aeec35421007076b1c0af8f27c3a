import { CustomerBalance } from './customer-balance.js';
export class CreditBalance {
    customerId;
    currencyCode;
    balance;
    constructor(creditBalance) {
        this.customerId = creditBalance.customer_id ? creditBalance.customer_id : null;
        this.currencyCode = creditBalance.currency_code ? creditBalance.currency_code : null;
        this.balance = creditBalance.balance ? new CustomerBalance(creditBalance.balance) : null;
    }
}
