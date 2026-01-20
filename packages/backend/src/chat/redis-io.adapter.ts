import { IoAdapter } from '@nestjs/platform-socket.io';
import type { INestApplication } from '@nestjs/common';
import type { ServerOptions, Server } from 'socket.io';
import { Redis } from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';

export class RedisIoAdapter extends IoAdapter {
  private pubClient: Redis;
  private subClient: Redis;

  constructor(app: INestApplication, redisUrl: string) {
    super(app);
    this.pubClient = new Redis(redisUrl, { lazyConnect: false });
    this.subClient = this.pubClient.duplicate();
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    const server: Server = super.createIOServer(port, {
      cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
      transports: ['websocket', 'polling'],
      ...(options || {}),
    });
    server.adapter(createAdapter(this.pubClient, this.subClient));
    return server;
  }
}
