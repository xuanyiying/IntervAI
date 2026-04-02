"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionLineItem = void 0;
const transaction_proration_js_1 = require("./transaction-proration.js");
const index_js_1 = require("../shared/index.js");
const index_js_2 = require("../product/index.js");
class TransactionLineItem {
    id;
    priceId;
    quantity;
    proration;
    taxRate;
    unitTotals;
    totals;
    product;
    constructor(transactionLineItem) {
        this.id = transactionLineItem.id;
        this.priceId = transactionLineItem.price_id;
        this.quantity = transactionLineItem.quantity;
        this.proration = transactionLineItem.proration ? new transaction_proration_js_1.TransactionProration(transactionLineItem.proration) : null;
        this.taxRate = transactionLineItem.tax_rate;
        this.unitTotals = transactionLineItem.unit_totals ? new index_js_1.UnitTotals(transactionLineItem.unit_totals) : null;
        this.totals = transactionLineItem.totals ? new index_js_1.Totals(transactionLineItem.totals) : null;
        this.product = transactionLineItem.product ? new index_js_2.Product(transactionLineItem.product) : null;
    }
}
exports.TransactionLineItem = TransactionLineItem;
