import { DynamicModule } from '@nestjs/common';
import { SharedBullAsyncConfiguration } from './interfaces';
import { BullModuleAsyncOptions, BullModuleOptions, BullRootModuleOptions } from './interfaces/bull-module-options.interface';
export declare class BullModule {
    /**
     * Registers a globally available configuration for all queues.
     *
     * @param bullConfig shared bull configuration object
     */
    static forRoot(bullConfig: BullRootModuleOptions): DynamicModule;
    /**
     * Registers a globally available configuration under a specified "configKey".
     *
     * @param configKey a key under which the configuration should be available
     * @param sharedBullConfig shared bull configuration object
     */
    static forRoot(configKey: string, bullConfig: BullRootModuleOptions): DynamicModule;
    /**
     * Registers a globally available configuration for all queues.
     *
     * @param asyncBullConfig shared bull configuration async factory
     */
    static forRootAsync(asyncBullConfig: SharedBullAsyncConfiguration): DynamicModule;
    /**
     * Registers a globally available configuration under a specified "configKey".
     *
     * @param configKey a key under which the configuration should be available
     * @param asyncBullConfig shared bull configuration async factory
     */
    static forRootAsync(configKey: string, asyncBullConfig: SharedBullAsyncConfiguration): DynamicModule;
    static registerQueue(...options: BullModuleOptions[]): DynamicModule;
    static registerQueueAsync(...options: BullModuleAsyncOptions[]): DynamicModule;
    private static createAsyncProviders;
    private static createAsyncOptionsProvider;
    private static createAsyncSharedConfigurationProviders;
    private static createAsyncSharedConfigurationProvider;
    private static registerCore;
    private static getUniqImports;
}
//# sourceMappingURL=bull.module.d.ts.map