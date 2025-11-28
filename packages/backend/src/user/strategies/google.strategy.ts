import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService
  ) {
    super({
      clientID:
        configService.get<string>('GOOGLE_CLIENT_ID') || 'mock-client-id',
      clientSecret:
        configService.get<string>('GOOGLE_CLIENT_SECRET') ||
        'mock-client-secret',
      callbackURL:
        configService.get<string>('GOOGLE_CALLBACK_URL') ||
        'http://localhost:3000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = await this.userService.validateOAuthLogin({
      email: emails[0].value,
      username: name.givenName + ' ' + name.familyName,
      avatarUrl: photos[0].value,
      provider: 'google',
      providerId: profile.id,
    });
    done(null, user);
  }
}
