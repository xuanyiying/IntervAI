import { ErrorCode } from '@/common/exceptions/error-codes';
import { ResourceNotFoundException } from '@/common/exceptions/resource-not-found.exception';
import { Sanitizer } from '@/common/utils/sanitizer';
import { InvitationService } from '@/core/invitation/invitation.service';
import { AuthResponseDto } from '@/core/user/dto/auth-response.dto';
import { LoginDto } from '@/core/user/dto/login.dto';
import { RegisterDto } from '@/core/user/dto/register.dto';
import { RedisService } from '@/shared/cache/redis.service';
import { PrismaService } from '@/shared/database/prisma.service';
import { EmailService } from '@/shared/notification/email.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SubscriptionTier, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PASSWORD_POLICY } from './auth.constants';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly invitationService: InvitationService,
    private readonly redisService: RedisService
  ) {}

  private validatePassword(password: string) {
    if (password.length < PASSWORD_POLICY.minLength) {
      throw new BadRequestException(
        `Password must be at least ${PASSWORD_POLICY.minLength} characters long`
      );
    }
    if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter'
      );
    }
    if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one lowercase letter'
      );
    }
    if (PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one number'
      );
    }
    if (
      PASSWORD_POLICY.requireSpecialChars &&
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      throw new BadRequestException(
        'Password must contain at least one special character'
      );
    }
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, username, phone, invitationCode, agreement } =
      registerDto;

    this.validatePassword(password);

    if (agreement === false) {
      throw new BadRequestException('Terms of service must be accepted');
    }

    const sanitizedInvitationCode = invitationCode
      ? Sanitizer.sanitizeString(invitationCode)
      : undefined;

    if (sanitizedInvitationCode) {
      const isCodeValid = await this.invitationService.validateCode(
        sanitizedInvitationCode
      );
      if (!isCodeValid) {
        throw new BadRequestException('Invalid or used invitation code');
      }
    }

    // Sanitize email
    const sanitizedEmail = Sanitizer.sanitizeEmail(email);

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password using bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Sanitize optional fields
    const sanitizedUsername = username
      ? Sanitizer.sanitizeString(username)
      : undefined;
    const sanitizedPhone = phone ? Sanitizer.sanitizeString(phone) : undefined;

    // Generate 6-digit verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    // Create new user
    const user = await this.prisma.user.create({
      data: {
        email: sanitizedEmail,
        passwordHash,
        username: sanitizedUsername,
        phone: sanitizedPhone,
        subscriptionTier: SubscriptionTier.FREE,
        isActive: true,
        emailVerified: false,
      },
    });

    // Store verification code in Redis with 10 minute expiry
    await this.redisService.set(
      `verify:${verificationCode}`,
      user.id,
      600 // 10 minutes
    );

    if (sanitizedInvitationCode) {
      await this.invitationService.markAsUsed(sanitizedInvitationCode, user.id);
    }

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        verificationCode,
        user.username || undefined
      );
      this.logger.log(`Verification email sent to ${user.email}`);
    } catch (error) {
      this.logger.warn(
        `Failed to send verification email to ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return this.generateAuthResponse(user);
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password, remember } = loginDto;

    // Sanitize email
    const sanitizedEmail = Sanitizer.sanitizeEmail(email);

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid =
      user.passwordHash && (await bcrypt.compare(password, user.passwordHash));

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login time
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateAuthResponse(user, remember);
  }

  /**
   * Verify JWT token and return user
   */
  async verifyToken(token: string): Promise<User> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid token');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(code: string): Promise<void> {
    // Get user ID from Redis using verification code
    const userId = await this.redisService.get(`verify:${code}`);

    if (!userId) {
      throw new ResourceNotFoundException(
        ErrorCode.NOT_FOUND,
        'Invalid or expired verification code'
      );
    }

    // Delete the code from Redis (one-time use)
    await this.redisService.del(`verify:${code}`);

    // Update user email verification status
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
      },
    });
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return;
    }

    // Generate 6-digit reset code
    const resetCode = crypto.randomInt(100000, 999999).toString();

    // Store reset code in Redis with 10 minute expiry
    await this.redisService.set(
      `reset:${resetCode}`,
      user.id,
      600 // 10 minutes
    );

    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        resetCode,
        user.username || undefined
      );
      this.logger.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
    }
  }

  /**
   * Reset password
   */
  async resetPassword(code: string, newPassword: string): Promise<void> {
    // Get user ID from Redis using reset code
    const userId = await this.redisService.get(`reset:${code}`);

    if (!userId) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    // Delete the code from Redis (one-time use)
    await this.redisService.del(`reset:${code}`);

    this.validatePassword(newPassword);
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
      },
    });
  }

  /**
   * Validate OAuth login
   */
  async validateOAuthLogin(profile: {
    email: string;
    username: string;
    avatarUrl?: string;
    provider: string;
    providerId: string;
  }): Promise<User> {
    // Check if user exists by email
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      // Create new user if not exists
      // Generate random password since they use OAuth
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          username: profile.username,
          passwordHash,
          subscriptionTier: SubscriptionTier.FREE,
          isActive: true,
          emailVerified: true, // OAuth emails are verified
          avatarUrl: profile.avatarUrl,
        },
      });
    } else {
      // Update existing user info if needed
      // For example, update avatar if not set
      if (!user.avatarUrl && profile.avatarUrl) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: profile.avatarUrl },
        });
      }
    }

    return user;
  }

  /**
   * Generate auth response for a user
   */
  generateAuthResponse(user: User, remember: boolean = false): AuthResponseDto {
    const accessToken = this.generateToken(user, remember);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username ?? undefined,
        subscriptionTier: user.subscriptionTier,
        emailVerified: user.emailVerified,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Generate JWT token for user
   */
  private generateToken(user: User, remember: boolean = false): string {
    const payload = {
      sub: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
    };

    // If remember is true, token is valid for 30 days, otherwise 7 days (default)
    const expiresIn = remember ? '30d' : undefined;

    return this.jwtService.sign(payload, expiresIn ? { expiresIn } : undefined);
  }
}
