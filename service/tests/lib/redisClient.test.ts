import { RedisClient } from '@shared/lib/RedisClient';
import { redisClient } from '@lib/redisClient';

describe('Redis Client', () => {
  it('should be a RedisClient', () => {
    expect(redisClient).toBeInstanceOf(RedisClient);
  });

  it('should have correct prefix', async () => {
    expect(redisClient.prefix).toEqual('authservice-service');
  });
});
