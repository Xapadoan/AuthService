import { createClient } from 'redis';

export class RedisClient {
  private client;
  readonly prefix;

  constructor({ prefix }: { prefix: string }) {
    this.prefix = prefix;
    this.client = createClient();
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
