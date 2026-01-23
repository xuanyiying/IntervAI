import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, SubscriptionTier } from '@prisma/client';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { Sanitizer } from '@/common/utils/sanitizer';
import { RegisterDto } from '@/user/dto/register.dto';
import { LoginDto } from '@/user/dto/login.dto';
import { AuthResponseDto } from '@/user/dto/auth-response.dto';
import { EmailService } from '@/email/email.service';
import { InvitationService } from '@/invitation/invitation.service';
import { RedisService } from '@/redis/redis.service';
import { ResourceNotFoundException } from '@/common/exceptions/resource-not-found.exception';
import { ErrorCode } from '@/common/exceptions/error-codes';
import { PASSWORD_POLICY } from './auth.constants';

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
      const isCodeValid =
        await this.invitationService.validateCode(sanitizedInvitationCode);
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

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

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
        verificationToken,
      },
    });

    if (sanitizedInvitationCode) {
      await this.invitationService.markAsUsed(sanitizedInvitationCode, user.id);
    }

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        user.email,
        verificationToken,
        user.username || undefined
      );
    } catch (error) {
      this.logger.debug('Failed to send verification email:', error);
      // Don't fail registration if email fails, user can resend later
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
  async verifyEmail(token: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new ResourceNotFoundException(
        ErrorCode.NOT_FOUND,
        'Invalid verification token'
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null, // Clear token after usage
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

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.username || undefined
      );
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    this.validatePassword(newPassword);
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
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
