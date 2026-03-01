import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { RegisterDto } from './register.dto';

describe('RegisterDto validation', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: false },
  });

  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: RegisterDto,
    data: '',
  };

  it('accepts agreement and no invitationCode', async () => {
    const payload = {
      email: 'test@adsfsda.com',
      password: 'adsfadaff',
      username: 'tests',
      agreement: true,
    };

    const result = await pipe.transform(payload, metadata);

    expect(result).toMatchObject({
      email: payload.email,
      username: payload.username,
      agreement: true,
    });
  });

  it('rejects unknown properties when forbidNonWhitelisted is enabled', async () => {
    const payload = {
      email: 'test@adsfsda.com',
      password: 'adsfadaff',
      username: 'tests',
      agreement: true,
      extra: 'nope',
    };

    await expect(pipe.transform(payload, metadata)).rejects.toBeDefined();
  });
});
