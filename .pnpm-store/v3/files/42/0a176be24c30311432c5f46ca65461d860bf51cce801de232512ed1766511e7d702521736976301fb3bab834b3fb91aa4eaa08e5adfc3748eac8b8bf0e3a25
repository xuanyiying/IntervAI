import { OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, ModuleRef } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { Queue } from 'bull';
import { BullMetadataAccessor } from './bull-metadata.accessor';
import { BullQueueEventOptions } from './bull.types';
import { ProcessOptions } from './decorators';
export declare class BullExplorer implements OnModuleInit {
    private readonly moduleRef;
    private readonly discoveryService;
    private readonly metadataAccessor;
    private readonly metadataScanner;
    private readonly logger;
    private readonly injector;
    constructor(moduleRef: ModuleRef, discoveryService: DiscoveryService, metadataAccessor: BullMetadataAccessor, metadataScanner: MetadataScanner);
    onModuleInit(): void;
    explore(): void;
    getQueue(queueToken: string, queueName: string): Queue;
    handleProcessor(instance: object, key: string, queue: Queue, moduleRef: Module, isRequestScoped: boolean, options?: ProcessOptions): void;
    handleListener(instance: object, key: string, wrapper: InstanceWrapper, queue: Queue, options: BullQueueEventOptions): void;
}
//# sourceMappingURL=bull.explorer.d.ts.map