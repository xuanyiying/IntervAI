/**
 * Circuit Breaker
 * Implements circuit breaker pattern for fault tolerance
 */

import { Logger } from '@nestjs/common';

export enum CircuitState {
    CLOSED = 'CLOSED',
    OPEN = 'OPEN',
    HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
    resetTimeout: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 30000,
    resetTimeout: 60000,
};

export class CircuitBreaker {
    private readonly logger = new Logger(CircuitBreaker.name);
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount: number = 0;
    private successCount: number = 0;
    private lastFailureTime: number = 0;
    private readonly config: CircuitBreakerConfig;

    constructor(
        private readonly name: string,
        config: Partial<CircuitBreakerConfig> = {}
    ) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    getState(): CircuitState {
        return this.state;
    }

    isOpen(): boolean {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
                this.state = CircuitState.HALF_OPEN;
                this.logger.log(`Circuit breaker [${this.name}] transitioned to HALF_OPEN`);
                return false;
            }
            return true;
        }
        return false;
    }

    recordSuccess(): void {
        this.failureCount = 0;

        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.config.successThreshold) {
                this.state = CircuitState.CLOSED;
                this.successCount = 0;
                this.logger.log(`Circuit breaker [${this.name}] transitioned to CLOSED`);
            }
        }
    }

    recordFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.OPEN;
            this.successCount = 0;
            this.logger.warn(`Circuit breaker [${this.name}] transitioned to OPEN from HALF_OPEN`);
        } else if (this.failureCount >= this.config.failureThreshold) {
            this.state = CircuitState.OPEN;
            this.logger.warn(
                `Circuit breaker [${this.name}] transitioned to OPEN (failures: ${this.failureCount})`
            );
        }
    }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.isOpen()) {
            throw new Error(`Circuit breaker [${this.name}] is OPEN`);
        }

        try {
            const result = await fn();
            this.recordSuccess();
            return result;
        } catch (error) {
            this.recordFailure();
            throw error;
        }
    }

    reset(): void {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.logger.log(`Circuit breaker [${this.name}] has been reset`);
    }
}
