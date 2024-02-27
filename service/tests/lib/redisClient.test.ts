import { RedisClient } from 'shared';
import { redisClient } from '@lib/redisClient';

describe('Redis Client', () => {
  afterAll(async () => {
    await redisClient.close();
  });
  it('should be a RedisClient', () => {
    expect(redisClient).toBeInstanceOf(RedisClient);
  });

  it('should have correct prefix', async () => {
    expect(redisClient.prefix).toEqual('authservice-service');
  });
});
