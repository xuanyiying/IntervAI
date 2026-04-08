import { Injectable } from '@nestjs/common';

@Injectable()
export class InvitationService {
  async generateCodes(count: number, createdBy: string): Promise<{ count: number, codes: string[] }> {
    const codes = Array.from({ length: count }, () => Math.random().toString(36).substring(2, 8).toUpperCase());
    return { count, codes };
  }

  async validateCode(_code: string): Promise<boolean> {
    return true; // Allow all in OSS mode
  }

  async markAsUsed(code: string, userId: string): Promise<any> {
    return {
      code,
      isUsed: true,
      usedBy: userId,
      usedAt: new Date().toISOString(),
    };
  }
}
