const mockGet = jest.fn();
const mockSet = jest.fn();
const mockConnect = jest.fn();
const mockQuit = jest.fn();
const mockCreateClient = jest.fn(() => ({
  set: mockSet,
  get: mockGet,
  connect: mockConnect,
  quit: mockQuit,
}));
jest.mock('redis', () => ({
  createClient: mockCreateClient,
}));

import { RedisClient } from '@lib/RedisClient';

describe('Redis Client', () => {
  it('should create a redis client', () => {
    const client = new RedisClient({ prefix: 'test' });
    expect(mockCreateClient).toHaveBeenCalled();
    expect(client.prefix).toEqual('test');
    expect(mockConnect).toHaveBeenCalled();
  });

  it('should use the prefix', async () => {
    const client = new RedisClient({ prefix: 'test' });
    await client.set('key', 'value', 60);
    expect(mockSet).toHaveBeenCalledWith('test:key', 'value', { EX: 60 });
    await client.get('key');
    expect(mockGet).toHaveBeenCalledWith('test:key');
  });

  it('should be able to close itself', async () => {
    const client = new RedisClient({ prefix: 'test' });
    await client.close();
    expect(mockQuit).toHaveBeenCalled();
  });
});
