import { MoneyNotification } from './money-notification.js';
export class UnitPriceOverrideNotification {
    countryCodes;
    unitPrice;
    constructor(unitPriceOverride) {
        this.countryCodes = unitPriceOverride.country_codes;
        this.unitPrice = new MoneyNotification(unitPriceOverride.unit_price);
    }
}
