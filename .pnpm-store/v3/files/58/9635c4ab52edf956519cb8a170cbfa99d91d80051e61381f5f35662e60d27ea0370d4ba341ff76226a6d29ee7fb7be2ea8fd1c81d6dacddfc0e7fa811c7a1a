"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionLineItemPreview = void 0;
const index_js_1 = require("../shared/index.js");
const index_js_2 = require("../product/index.js");
const proration_js_1 = require("../transaction/proration.js");
class TransactionLineItemPreview {
    priceId;
    quantity;
    taxRate;
    unitTotals;
    totals;
    product;
    proration;
    constructor(transactionLineItemPreview) {
        this.priceId = transactionLineItemPreview.price_id;
        this.quantity = transactionLineItemPreview.quantity;
        this.taxRate = transactionLineItemPreview.tax_rate;
        this.unitTotals = new index_js_1.UnitTotals(transactionLineItemPreview.unit_totals);
        this.totals = new index_js_1.Totals(transactionLineItemPreview.totals);
        this.product = new index_js_2.Product(transactionLineItemPreview.product);
        this.proration = transactionLineItemPreview.proration ? new proration_js_1.Proration(transactionLineItemPreview.proration) : null;
    }
}
exports.TransactionLineItemPreview = TransactionLineItemPreview;
