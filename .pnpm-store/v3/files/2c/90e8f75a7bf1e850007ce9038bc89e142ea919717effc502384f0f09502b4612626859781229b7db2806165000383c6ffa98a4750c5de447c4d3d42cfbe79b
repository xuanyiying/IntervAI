import { type IEvents } from '../../types/index.js';
import { type EventEntity } from './types.js';
export declare class Webhooks {
    unmarshal(requestBody: string, secretKey: string, signature: string): Promise<EventEntity>;
    isSignatureValid(requestBody: string, secretKey: string, signature: string): Promise<boolean>;
    static fromJson(data: IEvents): EventEntity;
}
