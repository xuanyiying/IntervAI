"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdjustmentItemNotification = void 0;
const adjustment_proration_notification_js_1 = require("./adjustment-proration-notification.js");
const adjustment_item_totals_notification_js_1 = require("./adjustment-item-totals-notification.js");
class AdjustmentItemNotification {
    id;
    itemId;
    type;
    amount;
    proration;
    totals;
    constructor(adjustmentItem) {
        this.id = adjustmentItem.id;
        this.itemId = adjustmentItem.item_id;
        this.type = adjustmentItem.type;
        this.amount = adjustmentItem.amount ? adjustmentItem.amount : null;
        this.proration = adjustmentItem.proration ? new adjustment_proration_notification_js_1.AdjustmentProrationNotification(adjustmentItem.proration) : null;
        this.totals = adjustmentItem.totals ? new adjustment_item_totals_notification_js_1.AdjustmentItemTotalsNotification(adjustmentItem.totals) : null;
    }
}
exports.AdjustmentItemNotification = AdjustmentItemNotification;
