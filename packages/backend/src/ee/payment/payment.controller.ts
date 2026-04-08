import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Headers,
  Req,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { RawBodyRequest } from '@nestjs/common';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  @ApiResponse({ status: 201, description: 'Checkout session created' })
  async createCheckoutSession(
    @Request() req: any,
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDto
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }
 
    return this.paymentService.createCheckoutSession(
      userId,
      createCheckoutSessionDto.priceId,
      createCheckoutSessionDto.provider,
      { tier: createCheckoutSessionDto.tier }
    );
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

  @Post('cancel-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel user subscription' })
  @ApiResponse({ status: 200, description: 'Subscription canceled' })
  async cancelSubscription(@Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User ID required');
    }
    return this.paymentService.cancelSubscription(userId);
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

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }
    return this.paymentService.handleWebhook(
      signature,
      req.rawBody as Buffer,
      'stripe'
    );
  }

  @Post('webhook/paddle')
  @ApiOperation({ summary: 'Paddle webhook handler' })
  async handlePaddleWebhook(
    @Headers('paddle-signature') signature: string,
    @Req() req: RawBodyRequest<Request>
  ) {
    if (!signature) {
      throw new BadRequestException('Missing paddle-signature header');
    }
    // Paddle might send raw body or JSON, depending on configuration.
    // Assuming rawBody is available.
    return this.paymentService.handleWebhook(
      signature,
      req.rawBody as Buffer, // Or req.body if JSON
      'paddle'
    );
  }
}
