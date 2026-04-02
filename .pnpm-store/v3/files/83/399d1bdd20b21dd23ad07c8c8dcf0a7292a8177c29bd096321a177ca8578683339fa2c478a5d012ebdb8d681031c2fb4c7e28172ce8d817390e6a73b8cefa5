"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConditionalDepHolder = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const missing_shared_bull_config_error_1 = require("../errors/missing-shared-bull-config.error");
function createConditionalDepHolder(depToken, optionalDep, errorFactory = (caller) => new missing_shared_bull_config_error_1.MissingBullSharedConfigurationError(depToken, caller)) {
    let ConditionalDepHolder = class ConditionalDepHolder {
        constructor(_dependencyRef) {
            this._dependencyRef = _dependencyRef;
        }
        getDependencyRef(caller) {
            if (depToken !== optionalDep && !this._dependencyRef) {
                throw errorFactory(caller);
            }
            return this._dependencyRef;
        }
    };
    ConditionalDepHolder = tslib_1.__decorate([
        tslib_1.__param(0, (0, common_1.Optional)()),
        tslib_1.__param(0, (0, common_1.Inject)(depToken)),
        tslib_1.__metadata("design:paramtypes", [Object])
    ], ConditionalDepHolder);
    return (0, common_1.mixin)(ConditionalDepHolder);
}
exports.createConditionalDepHolder = createConditionalDepHolder;
