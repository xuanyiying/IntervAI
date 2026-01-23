import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionTier } from '@prisma/client';

export class CreateCheckoutSessionDto {
  @ApiProperty({
    description: 'The Stripe Price ID for the subscription plan',
    example: 'price_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  priceId: string;

  @ApiPropertyOptional({
    description: 'Subscription tier for the plan (used for audit/history)',
    enum: SubscriptionTier,
  })
  @IsEnum(SubscriptionTier)
  @IsOptional()
  tier?: SubscriptionTier;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  provider?: 'stripe' | 'paddle';
}
