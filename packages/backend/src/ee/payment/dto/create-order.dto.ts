import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    description: '购买计划 ID（服务端计划目录）',
    example: 'pro_monthly',
    enum: [
      'pro_monthly',
      'pro_yearly',
      'enterprise_monthly',
      'enterprise_yearly',
    ],
  })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({
    description: '支付渠道',
    example: 'alipay',
    enum: ['alipay', 'wechat'],
  })
  @IsIn(['alipay', 'wechat'])
  provider: 'alipay' | 'wechat';
}
