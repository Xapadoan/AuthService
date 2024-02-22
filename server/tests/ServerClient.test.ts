import { config } from 'dotenv';
config({ path: 'tests/.env.test' });

const integration = {
  id: 1,
  apiKey: 'apiKey-1',
  registerWebhook: 'register-1',
  restoreWebhook: 'restore-1',
  resetConfirmationWebhook: 'reset-confirmation',
  resetCredentialsWebhook: 'reset-credentials-1',
};

const mockUuid = jest.fn(() => 'mocked-uuid');
jest.mock('uuid', () => ({ v4: mockUuid }));
const mockFetchJson = jest.fn().mockResolvedValue(integration);
const mockFetch = jest.fn().mockResolvedValue({
  json: mockFetchJson,
});
global.fetch = mockFetch;
jest.mock('@shared/lib/RedisClient');

import ServerClient from '../src/ServerClient';
import { expectResolvedValueMatch } from './utils';
import { RedisClient } from '@shared/lib/RedisClient';

const {
  AUTHSERVICE_SERVICE_HOST,
  AUTHSERVICE_INTEGRATION_ID,
  AUTHSERVICE_INTEGRATION_API_KEY,
} = process.env;

describe('ServerClient Init', () => {
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should take default config from env', async () => {
    const client = await ServerClient.init();
    const expectedBaseUrl = `${AUTHSERVICE_SERVICE_HOST}/${AUTHSERVICE_INTEGRATION_ID}`;
    expect(mockFetch).toHaveBeenCalledWith(expectedBaseUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${AUTHSERVICE_INTEGRATION_API_KEY}`,
      },
    });
    expectResolvedValueMatch(mockFetchJson, integration);
    expect(client.url).toEqual(expectedBaseUrl);
    expect(client.apiKey).toEqual(AUTHSERVICE_INTEGRATION_API_KEY);
    expect(client.integration).toMatchObject(integration);
    expect(RedisClient).toHaveBeenCalledWith({ prefix: 'authservice-server' });
  });

  it('should allow default config to be overridden', async () => {
    let client = await ServerClient.init({ apiKey: 'test-api-key' });
    let expectedBaseUrl = `${AUTHSERVICE_SERVICE_HOST}/${AUTHSERVICE_INTEGRATION_ID}`;
    expect(mockFetch).toHaveBeenCalledWith(expectedBaseUrl, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer test-api-key',
      },
    });
    expectResolvedValueMatch(mockFetchJson, integration);
    expect(client.url).toEqual(expectedBaseUrl);
    expect(client.apiKey).toEqual('test-api-key');
    expect(client.integration).toMatchObject(integration);
    client = await ServerClient.init({ integrationId: 3 });
    expectedBaseUrl = `${AUTHSERVICE_SERVICE_HOST}/3`;
    expect(mockFetch).toHaveBeenCalledWith(expectedBaseUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${AUTHSERVICE_INTEGRATION_API_KEY}`,
      },
    });
    expectResolvedValueMatch(mockFetchJson, integration);
    expect(client.url).toEqual(expectedBaseUrl);
    expect(client.apiKey).toEqual(AUTHSERVICE_INTEGRATION_API_KEY);
    expect(client.integration).toMatchObject(integration);
    client = await ServerClient.init({
      integrationId: 3,
      apiKey: 'test-api-key',
    });
    expectedBaseUrl = `${AUTHSERVICE_SERVICE_HOST}/3`;
    expect(mockFetch).toHaveBeenCalledWith(expectedBaseUrl, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer test-api-key',
      },
    });
    expectResolvedValueMatch(mockFetchJson, integration);
    expect(client.apiKey).toEqual('test-api-key');
    expect(client.url).toEqual(`${AUTHSERVICE_SERVICE_HOST}/3`);
    expect(client.integration).toMatchObject(integration);
  });
});

describe('ServerClient Init Register', () => {
  const setSpy = jest.spyOn(RedisClient.prototype, 'set');
  let client: ServerClient;

  beforeAll(async () => {
    client = await ServerClient.init();
    mockFetchJson.mockResolvedValue({ SVCRegisterToken: 'token' });
  });
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be able to init the register process', async () => {
    const result = await client.initRegister({ email: 'asd@mail.com' });
    expect(mockUuid).toHaveBeenCalled();
    expect(mockUuid).toHaveReturnedWith('mocked-uuid');
    expect(setSpy).toHaveBeenCalledWith('mocked-uuid', 'pending', 60 * 10);
    expect(mockFetch).toHaveBeenCalledWith(`${client.url}/register`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${client.apiKey}`,
      },
      body: JSON.stringify({ email: 'asd@mail.com' }),
    });
    expectResolvedValueMatch(mockFetchJson, { SVCRegisterToken: 'token' });
    expect(result).toMatchObject({
      uploadUrl: `${client.url}/register`,
      EACRegisterToken: 'mocked-uuid',
      SVCRegisterToken: 'token',
    });
  });

  it('should return undefined if anything throws', async () => {
    setSpy.mockImplementationOnce(() => {
      throw new Error('Intentional set error');
    });
    mockFetch.mockImplementationOnce(() => {
      throw new Error('Intentional fetch error');
    });
    mockFetchJson.mockImplementationOnce(() => {
      throw new Error('Intentional json error');
    });
    const results = await Promise.all([
      client.initRegister({ email: 'asd@mail.com' }),
      client.initRegister({ email: 'asd@mail.com' }),
      client.initRegister({ email: 'asd@mail.com' }),
    ]);
    expect(setSpy).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalled();
    expect(mockFetchJson).toHaveBeenCalled();
    results.forEach((result) => {
      expect(result).toBeUndefined();
    });
  });
});
