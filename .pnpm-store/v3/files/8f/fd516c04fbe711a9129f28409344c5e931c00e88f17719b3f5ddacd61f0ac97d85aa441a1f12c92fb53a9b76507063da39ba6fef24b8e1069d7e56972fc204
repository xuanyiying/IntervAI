"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressCreatedEvent = void 0;
const index_js_1 = require("../../helpers/index.js");
const event_js_1 = require("../../../entities/events/event.js");
const index_js_2 = require("../../entities/index.js");
class AddressCreatedEvent extends event_js_1.Event {
    eventType = index_js_1.EventName.AddressCreated;
    data;
    constructor(response) {
        super(response);
        this.data = new index_js_2.AddressNotification(response.data);
    }
}
exports.AddressCreatedEvent = AddressCreatedEvent;
