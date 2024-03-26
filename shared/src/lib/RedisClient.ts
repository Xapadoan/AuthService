import { createClient } from '@redis/client';

const { REDIS_HOST, REDIS_PORT } = process.env;

export class RedisClient {
  private client;
  readonly prefix;

  constructor({ prefix }: { prefix: string }) {
    this.prefix = prefix;
    this.client = createClient({
      socket: {
        host: String(REDIS_HOST || 'localhost'),
        port: Number(REDIS_PORT || 6379),
      },
    });
    this.client.connect();
  }

  async get(key: string) {
    return this.client.get(`${this.prefix}:${key}`);
  }
  async set(key: string, value: string, EX?: number) {
    return this.client.set(`${this.prefix}:${key}`, value, { EX });
  }
  async del(key: string) {
    return this.client.del(`${this.prefix}:${key}`);
  }
  async close() {
    await this.client.quit();
  }
}
