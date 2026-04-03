import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PASSWORD_POLICY } from '@/core/auth/auth.constants';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset code',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
  code: string;

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
