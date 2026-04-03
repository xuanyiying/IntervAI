import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(email: string, code: string, name?: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify your email address - Your verification code',
      template: './verification',
      context: {
        name: name || 'User',
        code,
      },
    });
  }

  async sendPasswordResetEmail(email: string, code: string, name?: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset your password - Your reset code',
      template: './reset-password',
      context: {
        name: name || 'User',
        code,
      },
    });
  }
}
