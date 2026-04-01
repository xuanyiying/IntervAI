"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InjectQueue = void 0;
const bull_shared_1 = require("@nestjs/bull-shared");
const common_1 = require("@nestjs/common");
/**
 * Injects Bull's queue instance with the given name
 * @param name queue name
 */
const InjectQueue = (name) => (0, common_1.Inject)((0, bull_shared_1.getQueueToken)(name));
exports.InjectQueue = InjectQueue;
