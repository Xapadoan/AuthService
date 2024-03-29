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
const mockFetch = jest.fn().mockResolvedValue('');
global.fetch = mockFetch;
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockDel = jest.fn();
const mockRedisClient = jest.fn().mockReturnValue({
  get: mockGet,
  set: mockSet,
  del: mockDel,
});
const mockHandleResponse = jest.fn().mockResolvedValue(integration);
jest.mock('@authservice/shared', () => ({
  RedisClient: mockRedisClient,
  handleResponse: mockHandleResponse,
}));

import { ServerClient } from '../src/ServerClient';
import { expectResolvedValueEqual, expectResolvedValueMatch } from './utils';

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
    expect(mockHandleResponse).toHaveBeenCalled();
    expectResolvedValueMatch(mockHandleResponse, integration);
    expect(client.url).toEqual(expectedBaseUrl);
    expect(client.apiKey).toEqual(AUTHSERVICE_INTEGRATION_API_KEY);
    expect(client.integration).toMatchObject(integration);
    expect(mockRedisClient).toHaveBeenCalledWith({
      prefix: 'authservice-server',
    });
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
    expect(mockHandleResponse).toHaveBeenCalled();
    expectResolvedValueMatch(mockHandleResponse, integration);
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
    expect(mockHandleResponse).toHaveBeenCalled();
    expectResolvedValueMatch(mockHandleResponse, integration);
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
    expect(mockHandleResponse).toHaveBeenCalled();
    expectResolvedValueMatch(mockHandleResponse, integration);
    expect(client.apiKey).toEqual('test-api-key');
    expect(client.url).toEqual(expectedBaseUrl);
    expect(client.integration).toMatchObject(integration);
  });
});

describe('ServerClient Init Register', () => {
  let client: ServerClient;

  beforeAll(async () => {
    client = await ServerClient.init();
    mockHandleResponse.mockResolvedValue({ SVCRegisterToken: 'token' });
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
    expect(mockSet).toHaveBeenCalledWith(
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
    expect(mockHandleResponse).toHaveBeenCalled();
    expectResolvedValueMatch(mockHandleResponse, { SVCRegisterToken: 'token' });
    expect(result).toMatchObject({
      uploadUrl: `${AUTHSERVICE_SERVICE_HOST}/upload/register`,
      EACRegisterToken: 'mocked-uuid',
      SVCRegisterToken: 'token',
    });
  });

  it('should return undefined if anything throws', async () => {
    mockSet.mockImplementationOnce(() => {
      throw new Error('Intentional set error');
    });
    mockFetch.mockImplementationOnce(() => {
      throw new Error('Intentional fetch error');
    });
    mockHandleResponse.mockImplementationOnce(() => {
      throw new Error('Intentional json error');
    });
    const results = await Promise.all([
      client.initRegister({ email: 'asd@mail.com' }),
      client.initRegister({ email: 'asd@mail.com' }),
      client.initRegister({ email: 'asd@mail.com' }),
    ]);
    expect(mockSet).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalled();
    expect(mockHandleResponse).toHaveBeenCalled();
    results.forEach((result) => {
      expect(result).toBeUndefined();
    });
  });
});

describe('Server Client Init Restore', () => {
  let client: ServerClient;

  beforeAll(async () => {
    client = await ServerClient.init();
    mockHandleResponse.mockResolvedValue({ SVCRestoreToken: 'token' });
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
    expect(mockSet).toHaveBeenCalledWith(
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
    expect(mockHandleResponse).toHaveBeenCalled();
    expectResolvedValueMatch(mockHandleResponse, { SVCRestoreToken: 'token' });
    expect(result).toMatchObject({
      uploadUrl: `${AUTHSERVICE_SERVICE_HOST}/upload/restore`,
      EACRestoreToken: 'mocked-uuid',
      SVCRestoreToken: 'token',
    });
  });

  it('should return undefined if anything throws', async () => {
    mockSet.mockImplementationOnce(() => {
      throw new Error('Intentional set error');
    });
    mockFetch.mockImplementationOnce(() => {
      throw new Error('Intentional fetch error');
    });
    mockHandleResponse.mockImplementationOnce(() => {
      throw new Error('Intentional json error');
    });
    const results = await Promise.all([
      client.initRestore({ email: 'asd@mail.com' }),
      client.initRestore({ email: 'asd@mail.com' }),
      client.initRestore({ email: 'asd@mail.com' }),
    ]);
    expect(mockSet).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalled();
    expect(mockHandleResponse).toHaveBeenCalled();
    results.forEach((result) => {
      expect(result).toBeUndefined();
    });
  });
});

describe('Server Client Init Reset', () => {
  let client: ServerClient;

  beforeAll(async () => {
    client = await ServerClient.init();
    mockHandleResponse.mockResolvedValue({ success: true });
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
    expect(mockHandleResponse).toHaveBeenCalled();
    expectResolvedValueMatch(mockHandleResponse, { success: true });
    expect(result).toMatchObject({ uploadUrl: expectedUploadUrl });
  });

  it('should return undefined if anything throws', async () => {
    mockFetch.mockImplementationOnce(() => {
      throw new Error('Intentional fetch error');
    });
    mockHandleResponse.mockImplementationOnce(() => {
      throw new Error('Intentional json error');
    });
    const results = await Promise.all([
      client.initReset({ email: 'asd@mail.com' }),
      client.initReset({ email: 'asd@mail.com' }),
    ]);
    expect(mockFetch).toHaveBeenCalled();
    expect(mockHandleResponse).toHaveBeenCalled();
    results.forEach((result) => {
      expect(result).toBeUndefined();
    });
  });
});

describe('ServerClient On Register Upload', () => {
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
    mockGet.mockResolvedValueOnce('pending');
    const result = await client.onRegisterUpload({
      EACRegisterToken: 'token',
      sessionId: 'sessionId',
    });
    expect(mockGet).toHaveBeenCalledWith('register:token');
    expectResolvedValueEqual(mockGet, 'pending');
    expect(mockSet).toHaveBeenCalledWith(
      'register:token',
      'sessionId',
      client.tmpStorageDuration
    );
    expect(result).toMatchObject({ success: true });
  });

  it('should not replace if existing value does not exist', async () => {
    mockGet.mockResolvedValueOnce(null);
    const result = await client.onRegisterUpload({
      EACRegisterToken: 'token',
      sessionId: 'sessionId',
    });
    expect(mockGet).toHaveBeenCalledWith('register:token');
    expectResolvedValueEqual(mockGet, null);
    expect(mockSet).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: false });
  });
});

describe('Server Client, On Restore Upload', () => {
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
    mockGet.mockResolvedValueOnce('pending');
    const result = await client.onRestoreUpload({
      EACRestoreToken: 'token',
      sessionId: 'sessionId',
    });
    expect(mockGet).toHaveBeenCalledWith('restore:token');
    expectResolvedValueEqual(mockGet, 'pending');
    expect(mockSet).toHaveBeenCalledWith(
      'restore:token',
      'sessionId',
      client.tmpStorageDuration
    );
    expect(result).toMatchObject({ success: true });
  });

  it('should not replace if existing value does not exist', async () => {
    mockGet.mockResolvedValueOnce(null);
    const result = await client.onRestoreUpload({
      EACRestoreToken: 'token',
      sessionId: 'sessionId',
    });
    expect(mockGet).toHaveBeenCalledWith('restore:token');
    expectResolvedValueEqual(mockGet, null);
    expect(mockSet).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: false });
  });

  it('should not replace if existing value is not pending', async () => {
    mockGet.mockResolvedValueOnce('not pending');
    const result = await client.onRestoreUpload({
      EACRestoreToken: 'token',
      sessionId: 'sessionId',
    });
    expect(mockGet).toHaveBeenCalledWith('restore:token');
    expectResolvedValueEqual(mockGet, 'not pending');
    expect(mockSet).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: false });
  });
});

describe('Server Client, On Reset Upload', () => {
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
    mockGet.mockResolvedValueOnce('pending');
    const result = await client.onResetUpload({
      EACResetToken: 'token',
      sessionId: 'sessionId',
    });
    expect(mockGet).toHaveBeenCalledWith('reset:token');
    expectResolvedValueEqual(mockGet, 'pending');
    expect(mockSet).toHaveBeenCalledWith(
      'reset:token',
      'sessionId',
      client.tmpStorageDuration
    );
    expect(result).toMatchObject({ success: true });
  });

  it('should not replace if existing value does not exist', async () => {
    mockGet.mockResolvedValueOnce(null);
    const result = await client.onResetUpload({
      EACResetToken: 'token',
      sessionId: 'sessionId',
    });
    expect(mockGet).toHaveBeenCalledWith('reset:token');
    expectResolvedValueEqual(mockGet, null);
    expect(mockSet).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: false });
  });

  it('should not replace if existing value is not pending', async () => {
    mockGet.mockResolvedValueOnce('not pending');
    const result = await client.onResetUpload({
      EACResetToken: 'token',
      sessionId: 'sessionId',
    });
    expect(mockGet).toHaveBeenCalledWith('reset:token');
    expectResolvedValueEqual(mockGet, 'not pending');
    expect(mockSet).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: false });
  });
});

describe('ServerClient Register Session Setup', () => {
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

  it('should store sessionId:userId', async () => {
    mockGet.mockResolvedValueOnce('sessionId');
    const result = await client.registerSetupSession({
      userId: '1',
      EACRegisterToken: 'token',
    });
    expect(mockGet).toHaveBeenCalledWith('register:token');
    expectResolvedValueEqual(mockGet, 'sessionId');
    expect(mockSet).toHaveBeenCalledWith(
      'session:sessionId',
      '1',
      client.sessionDuration
    );
    expect(mockDel).toHaveBeenCalledWith('register:token');
    expect(result).toMatchObject({
      success: true,
      sessionId: 'sessionId',
      maxAge: client.sessionDuration * 1000,
    });
  });

  it('should not store sessionId if token not found', async () => {
    mockGet.mockResolvedValueOnce(null);
    const result = await client.registerSetupSession({
      userId: '1',
      EACRegisterToken: 'token',
    });
    expect(mockGet).toHaveBeenCalledWith('register:token');
    expectResolvedValueEqual(mockGet, null);
    expect(mockSet).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: false });
  });
});

describe('ServerClient Restore Session Setup', () => {
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

  it('should store sessionId:userId', async () => {
    mockGet.mockResolvedValueOnce('sessionId');
    const result = await client.restoreSetupSession({
      userId: '1',
      EACRestoreToken: 'token',
    });
    expect(mockGet).toHaveBeenCalledWith('restore:token');
    expectResolvedValueEqual(mockGet, 'sessionId');
    expect(mockSet).toHaveBeenCalledWith(
      'session:sessionId',
      '1',
      client.sessionDuration
    );
    expect(mockDel).toHaveBeenCalledWith('restore:token');
    expect(result).toMatchObject({
      success: true,
      sessionId: 'sessionId',
      maxAge: client.sessionDuration * 1000,
    });
  });

  it('should not store sessionId if token not found', async () => {
    mockGet.mockResolvedValueOnce(null);
    const result = await client.restoreSetupSession({
      userId: '1',
      EACRestoreToken: 'token',
    });
    expect(mockGet).toHaveBeenCalledWith('restore:token');
    expectResolvedValueEqual(mockGet, null);
    expect(mockSet).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: false });
  });
});

describe('ServerClient Reset Session Setup', () => {
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

  it('should store sessionId:userId', async () => {
    mockGet.mockResolvedValueOnce('sessionId');
    const result = await client.resetSetupSession({
      userId: '1',
      EACResetToken: 'token',
    });
    expect(mockGet).toHaveBeenCalledWith('reset:token');
    expectResolvedValueEqual(mockGet, 'sessionId');
    expect(mockSet).toHaveBeenCalledWith(
      'session:sessionId',
      '1',
      client.sessionDuration
    );
    expect(mockDel).toHaveBeenCalledWith('reset:token');
    expect(result).toMatchObject({
      success: true,
      sessionId: 'sessionId',
      maxAge: client.sessionDuration * 1000,
    });
  });

  it('should not store sessionId if token not found', async () => {
    mockGet.mockResolvedValueOnce(null);
    const result = await client.resetSetupSession({
      userId: '1',
      EACResetToken: 'token',
    });
    expect(mockGet).toHaveBeenCalledWith('reset:token');
    expectResolvedValueEqual(mockGet, null);
    expect(mockSet).not.toHaveBeenCalled();
    expect(result).toMatchObject({ success: false });
  });
});

describe('Server Client, On Reset Confirm', () => {
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
    expect(mockSet).toHaveBeenCalledWith(
      'reset:mocked-uuid',
      'pending',
      client.tmpStorageDuration
    );
    expect(result).toEqual('mocked-uuid');
  });
});

describe('Server Client, Read / Delete Session', () => {
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

  it('should be able to read session', async () => {
    client.readSession('token');
    expect(mockGet).toHaveBeenCalledWith('session:token');
  });

  it('should be able to delete a session', async () => {
    client.deleteSession('token');
    expect(mockDel).toHaveBeenCalledWith('session:token');
  });
});
