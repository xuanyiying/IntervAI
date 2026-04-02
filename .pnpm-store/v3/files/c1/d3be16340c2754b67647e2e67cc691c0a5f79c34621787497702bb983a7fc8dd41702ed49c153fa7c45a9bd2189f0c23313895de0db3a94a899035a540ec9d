import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { ReportNotification } from '../../entities/index.js';
export class ReportCreatedEvent extends Event {
    eventType = EventName.ReportCreated;
    data;
    constructor(response) {
        super(response);
        this.data = new ReportNotification(response.data);
    }
}
