import { SubscriptionTier } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  subscriptionTier?: SubscriptionTier;
  iat?: number;
  exp?: number;
}
