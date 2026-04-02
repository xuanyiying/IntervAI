"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaxRatesUsedNotification = void 0;
const totals_notification_js_1 = require("./totals-notification.js");
class TaxRatesUsedNotification {
    taxRate;
    totals;
    constructor(taxRatesUsed) {
        this.taxRate = taxRatesUsed.tax_rate;
        this.totals = taxRatesUsed.totals ? new totals_notification_js_1.TotalsNotification(taxRatesUsed.totals) : null;
    }
}
exports.TaxRatesUsedNotification = TaxRatesUsedNotification;
