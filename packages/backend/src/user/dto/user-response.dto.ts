import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionTier, Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: 'uuid-123', description: 'User ID' })
  id!: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  email!: string;

  @ApiProperty({ example: 'johndoe', description: 'Username', required: false })
  username?: string;

  @ApiProperty({ enum: Role, example: Role.USER, description: 'User role' })
  role!: Role;

  @ApiProperty({ enum: SubscriptionTier, example: SubscriptionTier.FREE, description: 'Subscription tier' })
  subscriptionTier!: SubscriptionTier;

  @ApiProperty({ example: true, description: 'Whether the email is verified' })
  emailVerified!: boolean;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt!: Date;

  @ApiProperty({ example: '2023-01-02T00:00:00.000Z', description: 'Last update date', required: false })
  updatedAt?: Date;

  @ApiProperty({ example: '2023-01-02T00:00:00.000Z', description: 'Last login date', required: false })
  lastLoginAt?: Date | null;
}
