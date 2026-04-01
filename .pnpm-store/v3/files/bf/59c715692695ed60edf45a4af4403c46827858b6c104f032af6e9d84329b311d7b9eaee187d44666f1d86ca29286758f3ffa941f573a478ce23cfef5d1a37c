import { Type } from '@nestjs/common';
import { MissingBullSharedConfigurationError } from '../errors/missing-shared-bull-config.error';
export interface IConditionalDepHolder<T = any> {
    getDependencyRef(caller: string): T;
}
export declare function createConditionalDepHolder<T = any>(depToken: string, optionalDep?: string, errorFactory?: (caller: string) => MissingBullSharedConfigurationError): Type<IConditionalDepHolder>;
//# sourceMappingURL=create-conditional-dep-holder.helper.d.ts.map