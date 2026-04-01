import { Money } from './money.js';
export class UnitPriceOverride {
    countryCodes;
    unitPrice;
    constructor(unitPriceOverride) {
        this.countryCodes = unitPriceOverride.country_codes;
        this.unitPrice = new Money(unitPriceOverride.unit_price);
    }
}
