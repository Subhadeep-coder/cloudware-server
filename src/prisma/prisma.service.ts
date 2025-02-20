import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { withPulse } from '@prisma/extension-pulse';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();
    const pulseApiKey = process.env.PULSE_API_KEY;
    if (pulseApiKey && pulseApiKey !== '') {
      Object.assign(this, this.$extends(withPulse({ apiKey: pulseApiKey })));
      console.log('PrismaService: using Pulse extension');
    } else {
      Object.assign(this, this.$extends(withAccelerate()));
      console.log('PrismaService: using Accelerate extension');
    }
  }

  async onModuleInit() {
    await this.$connect();
    console.log('Prisma connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Prisma disconnected');
  }
}
