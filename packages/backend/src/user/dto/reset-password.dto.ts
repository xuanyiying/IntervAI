import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PASSWORD_POLICY } from '@/auth/auth.constants';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewPassword123!',
    minLength: PASSWORD_POLICY.minLength,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(PASSWORD_POLICY.minLength)
  newPassword: string;
}
