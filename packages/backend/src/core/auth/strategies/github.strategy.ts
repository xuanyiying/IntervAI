import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GithubStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService
  ) {
    const clientID = configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = configService.get<string>('GITHUB_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GITHUB_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      const logger = new Logger(GithubStrategy.name);
      logger.warn(
        'GitHub OAuth configuration is missing. GitHub Auth will be disabled.'
      );
    }

    super({
      clientID: clientID || 'missing-github-client-id',
      clientSecret: clientSecret || 'missing-github-client-secret',
      callbackURL: callbackURL || 'http://localhost/missing-callback',
      scope: ['user:email'],
    });

    if (clientID && clientSecret && callbackURL) {
      this.logger.log(
        `GitHub Strategy initialized with callbackURL: ${callbackURL}`
      );
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback
  ): Promise<any> {
    const { username, emails, photos } = profile;
    const user = await this.authService.validateOAuthLogin({
      email: emails && emails.length > 0 ? emails[0].value : '',
      username: username,
      avatarUrl: photos && photos.length > 0 ? photos[0].value : '',
      provider: 'github',
      providerId: profile.id,
    });
    done(null, user);
  }
}
