import 'dotenv/config';

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
  ok: true,
  json: mockFetchJson,
});
global.fetch = mockFetch;
jest.mock('@shared/lib/RedisClient');

import { ServerClient } from '../src/ServerClient';
import { expectResolvedValueEqual, expectResolvedValueMatch } from './utils';
import { RedisClient } from '@authservice/shared';

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
    const expectedBaseUrl = `${AUTHSERVICE_SERVICE_HOST}/integrations/${AUTHSERVICE_INTEGRATION_ID}`;
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
    let expectedBaseUrl = `${AUTHSERVICE_SERVICE_HOST}/integrations/${AUTHSERVICE_INTEGRATION_ID}`;
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
    expectedBaseUrl = `${AUTHSERVICE_SERVICE_HOST}/integrations/3`;
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
    expectedBaseUrl = `${AUTHSERVICE_SERVICE_HOST}/integrations/3`;
    expect(mockFetch).toHaveBeenCalledWith(expectedBaseUrl, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer test-api-key',
      },
    });
    expectResolvedValueMatch(mockFetchJson, integration);
    expect(client.apiKey).toEqual('test-api-key');
    expect(client.url).toEqual(expectedBaseUrl);
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
    expect(setSpy).toHaveBeenCalledWith(
      'register:mocked-uuid',
      'pending',
      client.tmpStorageDuration
    );
    expect(mockFetch).toHaveBeenCalledWith(`${client.url}/register`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${client.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'asd@mail.com' }),
    });
    expectResolvedValueMatch(mockFetchJson, { SVCRegisterToken: 'token' });
    expect(result).toMatchObject({
      uploadUrl: `${AUTHSERVICE_SERVICE_HOST}/upload/register`,
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

describe('Server Client Init Restore', () => {
  const setSpy = jest.spyOn(RedisClient.prototype, 'set');
  let client: ServerClient;

  beforeAll(async () => {
    client = await ServerClient.init();
    mockFetchJson.mockResolvedValue({ SVCRestoreToken: 'token' });
  });
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be able to init the restore process', async () => {
    const result = await client.initRestore({ email: 'asd@mail.com' });
    expect(mockUuid).toHaveBeenCalled();
    expect(mockUuid).toHaveReturnedWith('mocked-uuid');
    expect(setSpy).toHaveBeenCalledWith(
      'restore:mocked-uuid',
      'pending',
      client.tmpStorageDuration
    );
    expect(mockFetch).toHaveBeenCalledWith(`${client.url}/restore`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${client.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'asd@mail.com' }),
    });
    expectResolvedValueMatch(mockFetchJson, { SVCRestoreToken: 'token' });
    expect(result).toMatchObject({
      uploadUrl: `${AUTHSERVICE_SERVICE_HOST}/upload/restore`,
      EACRestoreToken: 'mocked-uuid',
      SVCRestoreToken: 'token',
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
      client.initRestore({ email: 'asd@mail.com' }),
      client.initRestore({ email: 'asd@mail.com' }),
      client.initRestore({ email: 'asd@mail.com' }),
    ]);
    expect(setSpy).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalled();
    expect(mockFetchJson).toHaveBeenCalled();
    results.forEach((result) => {
      expect(result).toBeUndefined();
    });
  });
});

describe('Server Client Init Reset', () => {
  let client: ServerClient;

  beforeAll(async () => {
    client = await ServerClient.init();
    mockFetchJson.mockResolvedValue({ success: true });
  });
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be able to init the reset process', async () => {
    const expectedUploadUrl = `${AUTHSERVICE_SERVICE_HOST}/upload/reset`;
    const result = await client.initReset({ email: 'asd@mail.com' });
    expect(mockFetch).toHaveBeenCalledWith(`${client.url}/reset`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${client.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'asd@mail.com' }),
    });
    expectResolvedValueMatch(mockFetchJson, { success: true });
    expect(result).toMatchObject({ uploadUrl: expectedUploadUrl });
  });

  it('should return undefined if anything throws', async () => {
    mockFetch.mockImplementationOnce(() => {
      throw new Error('Intentional fetch error');
    });
    mockFetchJson.mockImplementationOnce(() => {
      throw new Error('Intentional json error');
    });
    const results = await Promise.all([
      client.initReset({ email: 'asd@mail.com' }),
      client.initReset({ email: 'asd@mail.com' }),
    ]);
    expect(mockFetch).toHaveBeenCalled();
    expect(mockFetchJson).toHaveBeenCalled();
    results.forEach((result) => {
      expect(result).toBeUndefined();
    });
  });
});

describe('ServerClient On Register Upload', () => {
  const setSpy = jest.spyOn(RedisClient.prototype, 'set');
  const getSpy = jest.spyOn(RedisClient.prototype, 'get');
  let client: ServerClient;

  beforeAll(async () => {
    client = await ServerClient.init();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('should replace the existing register value', async () => {
    getSpy.mockResolvedValueOnce('pending');
    const result = await client.onRegisterUpload({
      EACRegisterToken: 'token',
      apiKey: 'apiKey',
    });
    expect(getSpy).toHaveBeenCalledWith('register:token');
    expectResolvedValueEqual(getSpy, 'pending');
    expect(setSpy).toHaveBeenCalledWith(
      'register:token',
      'apiKey',
      client.tmpStorageDuration
    );
    expect(result).toMatchObject({ success: true });
  });

  it('should not replace if existing value does not exist', async () => {
    getSpy.mockResolvedValueOnce(null);
    const result = await client.onRegisterUpload({
      EACRegisterToken: 'token',
      apiKey: 'apiKey',
    });
    expect(getSpy).toHaveBeenCalledWith('register:token');
    expectResolvedValueEqual(getSpy, null);
    expect(setSpy).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: false });
  });
});

describe('Server Client, On Restore Upload', () => {
  const setSpy = jest.spyOn(RedisClient.prototype, 'set');
  const getSpy = jest.spyOn(RedisClient.prototype, 'get');
  let client: ServerClient;

  beforeAll(async () => {
    client = await ServerClient.init();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('should replace the existing restore value', async () => {
    getSpy.mockResolvedValueOnce('pending');
    const result = await client.onRestoreUpload({
      EACRestoreToken: 'token',
      apiKey: 'apiKey',
    });
    expect(getSpy).toHaveBeenCalledWith('restore:token');
    expectResolvedValueEqual(getSpy, 'pending');
    expect(setSpy).toHaveBeenCalledWith(
      'restore:token',
      'apiKey',
      client.tmpStorageDuration
    );
    expect(result).toMatchObject({ success: true });
  });

  it('should not replace if existing value does not exist', async () => {
    getSpy.mockResolvedValueOnce(null);
    const result = await client.onRestoreUpload({
      EACRestoreToken: 'token',
      apiKey: 'apiKey',
    });
    expect(getSpy).toHaveBeenCalledWith('restore:token');
    expectResolvedValueEqual(getSpy, null);
    expect(setSpy).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: false });
  });

  it('should not replace if existing value is not pending', async () => {
    getSpy.mockResolvedValueOnce('not pending');
    const result = await client.onRestoreUpload({
      EACRestoreToken: 'token',
      apiKey: 'apiKey',
    });
    expect(getSpy).toHaveBeenCalledWith('restore:token');
    expectResolvedValueEqual(getSpy, 'not pending');
    expect(setSpy).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: false });
  });
});

describe('Server Client, On Reset Upload', () => {
  const setSpy = jest.spyOn(RedisClient.prototype, 'set');
  const getSpy = jest.spyOn(RedisClient.prototype, 'get');
  let client: ServerClient;

  beforeAll(async () => {
    client = await ServerClient.init();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('should replace the existing reset value', async () => {
    getSpy.mockResolvedValueOnce('pending');
    const result = await client.onResetUpload({
      EACResetToken: 'token',
      apiKey: 'apiKey',
    });
    expect(getSpy).toHaveBeenCalledWith('reset:token');
    expectResolvedValueEqual(getSpy, 'pending');
    expect(setSpy).toHaveBeenCalledWith(
      'reset:token',
      'apiKey',
      client.tmpStorageDuration
    );
    expect(result).toMatchObject({ success: true });
  });

  it('should not replace if existing value does not exist', async () => {
    getSpy.mockResolvedValueOnce(null);
    const result = await client.onResetUpload({
      EACResetToken: 'token',
      apiKey: 'apiKey',
    });
    expect(getSpy).toHaveBeenCalledWith('reset:token');
    expectResolvedValueEqual(getSpy, null);
    expect(setSpy).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: false });
  });

  it('should not replace if existing value is not pending', async () => {
    getSpy.mockResolvedValueOnce('not pending');
    const result = await client.onResetUpload({
      EACResetToken: 'token',
      apiKey: 'apiKey',
    });
    expect(getSpy).toHaveBeenCalledWith('reset:token');
    expectResolvedValueEqual(getSpy, 'not pending');
    expect(setSpy).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: false });
  });
});

describe('ServerClient Register Session Setup', () => {
  const setSpy = jest.spyOn(RedisClient.prototype, 'set');
  const getSpy = jest.spyOn(RedisClient.prototype, 'get');
  const delSpy = jest.spyOn(RedisClient.prototype, 'del');
  let client: ServerClient;

  beforeAll(async () => {
    client = await ServerClient.init();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('should generate a session id', async () => {
    getSpy.mockResolvedValueOnce('apiKey');
    const result = await client.registerSetupSession('token');
    expect(getSpy).toHaveBeenCalledWith('register:token');
    expectResolvedValueEqual(getSpy, 'apiKey');
    expect(mockUuid).toHaveBeenCalled();
    expect(mockUuid).toHaveReturnedWith('mocked-uuid');
    expect(setSpy).toHaveBeenCalledWith(
      'session:mocked-uuid',
      'apiKey',
      client.sessionDuration
    );
    expect(delSpy).toHaveBeenCalledWith('register:token');
    expect(result).toMatchObject({
      success: true,
      sessionId: 'mocked-uuid',
      expiresIn: client.sessionDuration,
    });
  });

  it('should not generate a session when apiKey is not found', async () => {
    getSpy.mockResolvedValueOnce(null);
    const result = await client.registerSetupSession('token');
    expect(getSpy).toHaveBeenCalledWith('register:token');
    expectResolvedValueEqual(getSpy, null);
    expect(setSpy).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: false });
  });
});

describe('ServerClient Restore Session Setup', () => {
  const setSpy = jest.spyOn(RedisClient.prototype, 'set');
  const getSpy = jest.spyOn(RedisClient.prototype, 'get');
  const delSpy = jest.spyOn(RedisClient.prototype, 'del');
  let client: ServerClient;

  beforeAll(async () => {
    client = await ServerClient.init();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('should generate a session id', async () => {
    getSpy.mockResolvedValueOnce('apiKey');
    const result = await client.restoreSetupSession('token');
    expect(getSpy).toHaveBeenCalledWith('restore:token');
    expectResolvedValueEqual(getSpy, 'apiKey');
    expect(mockUuid).toHaveBeenCalled();
    expect(mockUuid).toHaveReturnedWith('mocked-uuid');
    expect(setSpy).toHaveBeenCalledWith(
      'session:mocked-uuid',
      'apiKey',
      client.sessionDuration
    );
    expect(delSpy).toHaveBeenCalledWith('restore:token');
    expect(result).toMatchObject({
      success: true,
      sessionId: 'mocked-uuid',
      expiresIn: client.sessionDuration,
    });
  });

  it('should not generate a session when apiKey is not found', async () => {
    getSpy.mockResolvedValueOnce(null);
    const result = await client.restoreSetupSession('token');
    expect(getSpy).toHaveBeenCalledWith('restore:token');
    expectResolvedValueEqual(getSpy, null);
    expect(setSpy).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: false });
  });
});

describe('ServerClient Reset Session Setup', () => {
  const setSpy = jest.spyOn(RedisClient.prototype, 'set');
  const getSpy = jest.spyOn(RedisClient.prototype, 'get');
  const delSpy = jest.spyOn(RedisClient.prototype, 'del');
  let client: ServerClient;

  beforeAll(async () => {
    client = await ServerClient.init();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('should generate a session id', async () => {
    getSpy.mockResolvedValueOnce('apiKey');
    const result = await client.resetSetupSession('token');
    expect(getSpy).toHaveBeenCalledWith('reset:token');
    expectResolvedValueEqual(getSpy, 'apiKey');
    expect(mockUuid).toHaveBeenCalled();
    expect(mockUuid).toHaveReturnedWith('mocked-uuid');
    expect(setSpy).toHaveBeenCalledWith(
      'session:mocked-uuid',
      'apiKey',
      client.sessionDuration
    );
    expect(delSpy).toHaveBeenCalledWith('reset:token');
    expect(result).toMatchObject({
      success: true,
      sessionId: 'mocked-uuid',
      expiresIn: client.sessionDuration,
    });
  });

  it('should not generate a session when apiKey is not found', async () => {
    getSpy.mockResolvedValueOnce(null);
    const result = await client.resetSetupSession('token');
    expect(getSpy).toHaveBeenCalledWith('reset:token');
    expectResolvedValueEqual(getSpy, null);
    expect(setSpy).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: false });
  });
});

describe('Server Client, On Reset Confirm', () => {
  const setSpy = jest.spyOn(RedisClient.prototype, 'set');
  let client: ServerClient;

  beforeAll(async () => {
    client = await ServerClient.init();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('should generate and store a token', async () => {
    const result = await client.onResetConfirm();
    expect(mockUuid).toHaveBeenCalled();
    expect(mockUuid).toHaveReturnedWith('mocked-uuid');
    expect(setSpy).toHaveBeenCalledWith(
      'reset:mocked-uuid',
      'pending',
      client.tmpStorageDuration
    );
    expect(result).toEqual('mocked-uuid');
  });
});
