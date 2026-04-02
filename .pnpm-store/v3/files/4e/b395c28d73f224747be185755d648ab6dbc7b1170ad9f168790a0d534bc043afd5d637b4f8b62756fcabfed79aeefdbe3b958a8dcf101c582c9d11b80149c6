import type { DiscriminatedSimulationEventResponse } from '../../../types/index.js';
import type { Status } from '../../../enums/index.js';
interface BaseUpdateSimulationRequestBody {
    notificationSettingId?: string;
    name?: string;
    status?: Status;
}
type RawUpdateSimulationRequestBody = DiscriminatedSimulationEventResponse<BaseUpdateSimulationRequestBody>;
export type UpdateSimulationRequestBody = {
    [Key in keyof RawUpdateSimulationRequestBody]?: RawUpdateSimulationRequestBody[Key];
};
export {};
