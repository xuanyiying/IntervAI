"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethodDeletedEvent = void 0;
const event_js_1 = require("../../../entities/events/event.js");
const index_js_1 = require("../../entities/index.js");
const index_js_2 = require("../../helpers/index.js");
class PaymentMethodDeletedEvent extends event_js_1.Event {
    eventType = index_js_2.EventName.PaymentMethodDeleted;
    data;
    constructor(response) {
        super(response);
        this.data = new index_js_1.PaymentMethodDeletedNotification(response.data);
    }
}
exports.PaymentMethodDeletedEvent = PaymentMethodDeletedEvent;
