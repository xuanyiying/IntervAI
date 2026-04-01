import { Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BullQueueEventOptions } from './bull.types';
import { ProcessOptions } from './decorators';
export declare class BullMetadataAccessor {
    private readonly reflector;
    constructor(reflector: Reflector);
    isQueueComponent(target: Type<any> | Function): boolean;
    isProcessor(target: Type<any> | Function): boolean;
    isListener(target: Type<any> | Function): boolean;
    getQueueComponentMetadata(target: Type<any> | Function): any;
    getProcessMetadata(target: Type<any> | Function): ProcessOptions | undefined;
    getListenerMetadata(target: Type<any> | Function): BullQueueEventOptions | undefined;
}
//# sourceMappingURL=bull-metadata.accessor.d.ts.map