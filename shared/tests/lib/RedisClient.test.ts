const mockGet = jest.fn();
const mockSet = jest.fn();
const mockCreateClient = jest.fn(() => ({ set: mockSet, get: mockGet }));
jest.mock('redis', () => ({
  createClient: mockCreateClient,
}));

import { RedisClient } from '@lib/RedisClient';

describe('Redis Client', () => {
  it('should create a redis client', () => {
    const client = new RedisClient({ prefix: 'test' });
    expect(mockCreateClient).toHaveBeenCalled();
    expect(client.prefix).toEqual('test');
  });

  it('should use the prefix', async () => {
    const client = new RedisClient({ prefix: 'test' });
    await client.set('key', 'value', 60);
    expect(mockSet).toHaveBeenCalledWith('test:key', 'value', { EX: 60 });
    await client.get('key');
    expect(mockGet).toHaveBeenCalledWith('test:key');
  });
});
