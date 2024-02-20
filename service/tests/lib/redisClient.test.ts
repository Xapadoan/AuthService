const mockClient = {
  get: jest.fn(),
  set: jest.fn(),
};
const mockCreateClient = jest.fn(() => mockClient);
jest.mock('redis', () => ({ createClient: mockCreateClient }));

import { set, get } from '@lib/redisClient';

describe('Redis Client', () => {
  afterAll(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set with prefix', async () => {
    await set('key', 'value', 2);
    expect(mockClient.set).toHaveBeenCalled();
    expect(mockClient.set).toHaveBeenCalledWith(
      'authservice-main:key',
      'value',
      { EX: 2 }
    );
  });

  it('should get with prefix', async () => {
    await get('key');
    expect(mockClient.get).toHaveBeenCalled();
    expect(mockClient.get).toHaveBeenCalledWith('authservice-main:key');
  });
});
