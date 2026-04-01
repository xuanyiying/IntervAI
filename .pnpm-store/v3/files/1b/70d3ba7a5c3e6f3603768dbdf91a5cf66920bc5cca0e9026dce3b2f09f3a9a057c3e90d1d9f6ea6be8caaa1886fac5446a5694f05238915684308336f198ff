"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressUpdatedEvent = void 0;
const event_js_1 = require("../../../entities/events/event.js");
const index_js_1 = require("../../helpers/index.js");
const index_js_2 = require("../../entities/index.js");
class AddressUpdatedEvent extends event_js_1.Event {
    eventType = index_js_1.EventName.AddressUpdated;
    data;
    constructor(response) {
        super(response);
        this.data = new index_js_2.AddressNotification(response.data);
    }
}
exports.AddressUpdatedEvent = AddressUpdatedEvent;
