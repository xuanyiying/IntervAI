import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  Req,
  Res,
  UnauthorizedException,
  RawBodyRequest,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CreateOrderDto } from '../dto/create-order.dto';
import { SubscriptionResponseDto } from '../dto/subscription-response.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Get('plans')
  @ApiOperation({ summary: '获取购买计划目录（含服务端定价）' })
  @ApiResponse({ status: 200, description: 'Plan catalog' })
  getPlans() {
    return this.paymentService.getPlans();
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建支付订单（支付宝跳转 / 微信扫码）' })
  @ApiResponse({ status: 201, description: 'Payment order created' })
  async createOrder(@Request() req: any, @Body() dto: CreateOrderDto) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }
    return this.paymentService.createPayment(userId, dto.planId, dto.provider);
  }

  @Get('orders/:orderNo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询订单状态（含渠道侧兜底查询）' })
  @ApiResponse({ status: 200, description: 'Order status' })
  async getOrderStatus(@Request() req: any, @Param('orderNo') orderNo: string) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }
    return this.paymentService.getOrderStatus(userId, orderNo);
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user subscription details' })
  @ApiResponse({
    status: 200,
    description: 'Subscription details',
    type: SubscriptionResponseDto,
  })
  async getUserSubscription(@Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }
    return this.paymentService.getUserSubscription(userId);
  }

  @Get('billing-history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user billing history' })
  @ApiResponse({ status: 200, description: 'Billing history' })
  async getBillingHistory(@Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }
    return this.paymentService.getBillingHistory(userId);
  }

  @Post('notify/alipay')
  @ApiOperation({ summary: '支付宝异步通知（form-urlencoded）' })
  async handleAlipayNotify(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response
  ) {
    try {
      await this.paymentService.handleNotify(
        'alipay',
        req.headers as unknown as Record<string, string | string[] | undefined>,
        req.rawBody as Buffer
      );
      // 支付宝要求应答正文为 success，否则会重试通知
      return res.type('text/plain').send('success');
    } catch (error: any) {
      this.logger.warn(`支付宝通知处理失败: ${error.message}`);
      return res.type('text/plain').send('fail');
    }
  }

  @Post('notify/wechat')
  @ApiOperation({ summary: '微信支付回调通知（APIv3 JSON）' })
  async handleWechatNotify(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response
  ) {
    try {
      await this.paymentService.handleNotify(
        'wechat',
        req.headers as unknown as Record<string, string | string[] | undefined>,
        req.rawBody as Buffer
      );
      return res.status(200).json({ code: 'SUCCESS', message: '成功' });
    } catch (error: any) {
      this.logger.warn(`微信支付通知处理失败: ${error.message}`);
      return res
        .status(500)
        .json({ code: 'FAIL', message: error.message || '处理失败' });
    }
  }
}
