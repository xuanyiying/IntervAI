"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodSavedEvent = void 0;
const event_js_1 = require("../../../entities/events/event.js");
const index_js_1 = require("../../entities/index.js");
const index_js_2 = require("../../helpers/index.js");
class PaymentMethodSavedEvent extends event_js_1.Event {
    eventType = index_js_2.EventName.PaymentMethodSaved;
    data;
    constructor(response) {
        super(response);
        this.data = new index_js_1.PaymentMethodNotification(response.data);
    }
}
exports.PaymentMethodSavedEvent = PaymentMethodSavedEvent;
