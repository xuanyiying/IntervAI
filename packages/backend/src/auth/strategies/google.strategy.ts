import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('Google OAuth configuration is missing');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });

    this.logger.log(
      `Google Strategy initialized with callbackURL: ${callbackURL}`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = await this.authService.validateOAuthLogin({
      email: emails && emails.length > 0 ? emails[0].value : '',
      username: name ? name.givenName + ' ' + name.familyName : '',
      avatarUrl: photos && photos.length > 0 ? photos[0].value : '',
      provider: 'google',
      providerId: profile.id,
    });
    done(null, user);
  }
}
