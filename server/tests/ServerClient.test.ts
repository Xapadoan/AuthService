const mockUuid = jest.fn(() => 'mocked-uuid');
jest.mock('uuid', () => ({ v4: mockUuid }));
const mockFetchJson = jest
  .fn()
  .mockResolvedValue({ SVCRegisterToken: 'token' });
const mockFetch = jest.fn().mockResolvedValue({
  json: mockFetchJson,
});
global.fetch = mockFetch;
jest.mock('@shared/lib/RedisClient');

import ServerClient from '../src/ServerClient';
import { expectResolvedValueMatch } from './utils';
import { RedisClient } from '@shared/lib/RedisClient';

describe('ServerClient', () => {
  const setSpy = jest.spyOn(RedisClient.prototype, 'set');
  const integration = {
    id: 1,
    apiKey: 'apiKey-1',
    registerWebhook: 'register-1',
    restoreWebhook: 'restore-1',
    resetConfirmationWebhook: 'reset-confirmation',
    resetCredentialsWebhook: 'reset-credentials-1',
  };

  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct default config', () => {
    const client = new ServerClient(integration);
    expect(client.config.host).toEqual('http://localhost:8080');
    expect(client.config.registerPath).toEqual('register');
    expect(RedisClient).toHaveBeenCalledWith({ prefix: 'authservice-server' });
  });

  it('should allow default config to be overridden', () => {
    const client = new ServerClient(integration, {
      host: 'https://mydomain.com',
    });
    expect(client.config.host).toEqual('https://mydomain.com');
    expect(client.config.registerPath).toEqual('register');
  });

  it('should be able to init the register process', async () => {
    const client = new ServerClient(integration);
    const result = await client.initRegister({ email: 'asd@mail.com' });
    expect(mockUuid).toHaveBeenCalled();
    expect(mockUuid).toHaveReturnedWith('mocked-uuid');
    expect(setSpy).toHaveBeenCalledWith('mocked-uuid', 'pending', 60 * 10);
    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/1/register', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer apiKey-1',
      },
      body: JSON.stringify({ email: 'asd@mail.com' }),
    });
    expectResolvedValueMatch(mockFetchJson, { SVCRegisterToken: 'token' });
    expect(result).toMatchObject({
      uploadUrl: 'http://localhost:8080/1/register',
      EACRegisterToken: 'mocked-uuid',
      SVCRegisterToken: 'token',
    });
  });

  it('should return undefined if anything throws', async () => {
    setSpy.mockImplementationOnce(() => {
      throw new Error('Intentional set error');
    });
    mockFetch.mockImplementationOnce(() => {
      throw new Error('Intentional set error');
    });
    mockFetchJson.mockImplementationOnce(() => {
      throw new Error('Intentional set error');
    });
    const client = new ServerClient(integration);
    const results = await Promise.all([
      client.initRegister({ email: 'asd@mail.com' }),
      client.initRegister({ email: 'asd@mail.com' }),
      client.initRegister({ email: 'asd@mail.com' }),
    ]);
    // expect(mockSet).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalled();
    expect(mockFetchJson).toHaveBeenCalled();
    results.forEach((result) => {
      expect(result).toBeUndefined();
    });
  });
});
