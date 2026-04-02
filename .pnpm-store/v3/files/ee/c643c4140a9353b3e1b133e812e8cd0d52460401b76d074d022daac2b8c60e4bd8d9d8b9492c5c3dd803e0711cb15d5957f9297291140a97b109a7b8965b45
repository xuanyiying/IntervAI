"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitPriceOverrideNotification = void 0;
const money_notification_js_1 = require("./money-notification.js");
class UnitPriceOverrideNotification {
    countryCodes;
    unitPrice;
    constructor(unitPriceOverride) {
        this.countryCodes = unitPriceOverride.country_codes;
        this.unitPrice = new money_notification_js_1.MoneyNotification(unitPriceOverride.unit_price);
    }
}
exports.UnitPriceOverrideNotification = UnitPriceOverrideNotification;
