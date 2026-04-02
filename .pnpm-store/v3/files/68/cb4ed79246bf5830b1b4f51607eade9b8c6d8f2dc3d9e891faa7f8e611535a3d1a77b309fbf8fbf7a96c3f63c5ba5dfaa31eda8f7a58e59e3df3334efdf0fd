"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionDetailsPreview = void 0;
const index_js_1 = require("../shared/index.js");
const transaction_line_item_preview_js_1 = require("./transaction-line-item-preview.js");
class TransactionDetailsPreview {
    taxRatesUsed;
    totals;
    lineItems;
    constructor(transactionDetailsPreview) {
        this.taxRatesUsed = transactionDetailsPreview.tax_rates_used.map((tax_rates_used) => new index_js_1.TaxRatesUsed(tax_rates_used));
        this.totals = new index_js_1.TransactionTotals(transactionDetailsPreview.totals);
        this.lineItems = transactionDetailsPreview.line_items.map((line_item) => new transaction_line_item_preview_js_1.TransactionLineItemPreview(line_item));
    }
}
exports.TransactionDetailsPreview = TransactionDetailsPreview;
