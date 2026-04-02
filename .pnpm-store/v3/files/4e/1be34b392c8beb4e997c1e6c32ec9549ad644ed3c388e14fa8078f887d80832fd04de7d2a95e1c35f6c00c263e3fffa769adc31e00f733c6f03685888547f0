"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditBalance = void 0;
const customer_balance_js_1 = require("./customer-balance.js");
class CreditBalance {
    customerId;
    currencyCode;
    balance;
    constructor(creditBalance) {
        this.customerId = creditBalance.customer_id ? creditBalance.customer_id : null;
        this.currencyCode = creditBalance.currency_code ? creditBalance.currency_code : null;
        this.balance = creditBalance.balance ? new customer_balance_js_1.CustomerBalance(creditBalance.balance) : null;
    }
}
exports.CreditBalance = CreditBalance;
