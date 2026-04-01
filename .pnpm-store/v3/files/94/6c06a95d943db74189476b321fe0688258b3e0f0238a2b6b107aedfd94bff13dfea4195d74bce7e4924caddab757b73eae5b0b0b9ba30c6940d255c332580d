import { Event } from '../../../entities/events/event.js';
import { EventName } from '../../helpers/index.js';
import { ReportNotification } from '../../entities/index.js';
export class ReportUpdatedEvent extends Event {
    eventType = EventName.ReportUpdated;
    data;
    constructor(response) {
        super(response);
        this.data = new ReportNotification(response.data);
    }
}
