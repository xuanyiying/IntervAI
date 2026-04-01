"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionResumedEvent = void 0;
const event_js_1 = require("../../../entities/events/event.js");
const index_js_1 = require("../../helpers/index.js");
const index_js_2 = require("../../entities/index.js");
class SubscriptionResumedEvent extends event_js_1.Event {
    eventType = index_js_1.EventName.SubscriptionResumed;
    data;
    constructor(response) {
        super(response);
        this.data = new index_js_2.SubscriptionNotification(response.data);
    }
}
exports.SubscriptionResumedEvent = SubscriptionResumedEvent;
