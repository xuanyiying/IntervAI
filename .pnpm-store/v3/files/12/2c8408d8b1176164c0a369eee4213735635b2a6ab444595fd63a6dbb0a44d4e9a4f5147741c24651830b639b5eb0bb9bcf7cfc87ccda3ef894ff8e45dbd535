"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BullMetadataAccessor = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const bull_constants_1 = require("./bull.constants");
let BullMetadataAccessor = class BullMetadataAccessor {
    constructor(reflector) {
        this.reflector = reflector;
    }
    isQueueComponent(target) {
        if (!target) {
            return false;
        }
        return !!this.reflector.get(bull_constants_1.BULL_MODULE_QUEUE, target);
    }
    isProcessor(target) {
        if (!target) {
            return false;
        }
        return !!this.reflector.get(bull_constants_1.BULL_MODULE_QUEUE_PROCESS, target);
    }
    isListener(target) {
        if (!target) {
            return false;
        }
        return !!this.reflector.get(bull_constants_1.BULL_MODULE_ON_QUEUE_EVENT, target);
    }
    getQueueComponentMetadata(target) {
        return this.reflector.get(bull_constants_1.BULL_MODULE_QUEUE, target);
    }
    getProcessMetadata(target) {
        return this.reflector.get(bull_constants_1.BULL_MODULE_QUEUE_PROCESS, target);
    }
    getListenerMetadata(target) {
        return this.reflector.get(bull_constants_1.BULL_MODULE_ON_QUEUE_EVENT, target);
    }
};
exports.BullMetadataAccessor = BullMetadataAccessor;
exports.BullMetadataAccessor = BullMetadataAccessor = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [core_1.Reflector])
], BullMetadataAccessor);
