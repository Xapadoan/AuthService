const mockGet = jest.fn();
const mockSet = jest.fn();
const mockDel = jest.fn();
const mockConnect = jest.fn();
const mockQuit = jest.fn();
const mockCreateClient = jest.fn(() => ({
  set: mockSet,
  get: mockGet,
  del: mockDel,
  connect: mockConnect,
  quit: mockQuit,
}));
jest.mock('@redis/client', () => ({
  createClient: mockCreateClient,
}));

import 'dotenv/config';
import { RedisClient } from '@lib/RedisClient';

const { REDIS_HOST, REDIS_PORT } = process.env;

describe('Redis Client', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });
  it('should create a redis client', () => {
    const client = new RedisClient({ prefix: 'test' });
    expect(mockCreateClient).toHaveBeenCalledWith({
      socket: {
        host: String(REDIS_HOST),
        port: Number(REDIS_PORT),
      },
    });
    expect(client.prefix).toEqual('test');
    expect(mockConnect).toHaveBeenCalled();
  });

  it('should use the prefix', async () => {
    const client = new RedisClient({ prefix: 'test' });
    await client.set('key', 'value', 60);
    expect(mockSet).toHaveBeenCalledWith('test:key', 'value', { EX: 60 });
    await client.get('key');
    expect(mockGet).toHaveBeenCalledWith('test:key');
    await client.del('key');
    expect(mockDel).toHaveBeenCalledWith('test:key');
  });

  it('should be able to close itself', async () => {
    const client = new RedisClient({ prefix: 'test' });
    await client.close();
    expect(mockQuit).toHaveBeenCalled();
  });
});
