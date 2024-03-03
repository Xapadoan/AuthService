jest.mock('authservice-shared');

import { RedisClient } from 'authservice-shared';

const MockRedisClient = jest.mocked(RedisClient);

import { redisClient } from '@lib/redisClient';

describe('Redis Client', () => {
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('should be a RedisClient', () => {
    expect(redisClient).toBeInstanceOf(MockRedisClient);
    expect(MockRedisClient).toHaveBeenCalled();
    expect(MockRedisClient).toHaveBeenCalledWith({
      prefix: 'authservice-service',
    });
  });
});
