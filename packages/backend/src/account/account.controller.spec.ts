import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 'user-1' };
    return true;
  }
}

describe('AccountController', () => {
  let app: INestApplication;
  const accountService = {
    getSubscription: jest.fn().mockResolvedValue({ ok: true }),
    getUsage: jest.fn().mockResolvedValue({ ok: true }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [{ provide: AccountService, useValue: accountService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('/api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/account/subscription should be routable', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/account/subscription')
      .expect(200);
    expect(accountService.getSubscription).toHaveBeenCalledWith('user-1');
  });

  it('GET /api/v1/account/usage should be routable', async () => {
    await request(app.getHttpServer()).get('/api/v1/account/usage').expect(200);
    expect(accountService.getUsage).toHaveBeenCalledWith('user-1', {
      start: undefined,
      end: undefined,
    });
  });
});
